import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useHomeData(householdId, viewMode = 'Daily', selectedDate = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!householdId) return
    fetchAll()
  }, [householdId, viewMode, selectedDate])

  async function fetchAll() {
    setLoading(true)
    setData(null)   // clear stale data immediately so switching viewModes never leaks previous mode's devices
    setError(null)

    try {
      // ── 1. Resolve active date ─────────────────────────────
      const activeDate = selectedDate
        ? new Date(`${selectedDate}T23:59:59`)
        : new Date()
      const currentDateStr = activeDate.toISOString().split('T')[0]
      const todayRealStr = new Date().toISOString().split('T')[0]
      const isToday = currentDateStr === todayRealStr

      // 6:00 AM IST = 00:30 UTC — matches daily_reports window_start exactly
      const windowStart = new Date(Date.UTC(
        activeDate.getUTCFullYear(),
        activeDate.getUTCMonth(),
        activeDate.getUTCDate(),
        0, 30, 0
      ))
      const windowStartStr = windowStart.toISOString()
      const windowEndStr   = activeDate.toISOString()

      console.log('[useHomeData] fetching for', householdId, currentDateStr, 'viewMode:', viewMode)

      // ── 2. Fire parallel queries ──────────────────────────────────────────
      const [
        todayReportResult,
        weeklyHistoryResult,
        billingCycleResult,
        todaySessionsResult,
        allLastCompletedResult,
        allOpenSessionsResult,
        allSessionsResult,
      ] = await Promise.all([
        supabase.from('daily_reports').select('*').eq('household_id', householdId).eq('report_date', currentDateStr).maybeSingle(),
        supabase.from('daily_reports').select('*').eq('household_id', householdId).lte('report_date', currentDateStr).order('report_date', { ascending: false }).limit(7),
        supabase.from('billing_cycle_summary').select('*').eq('household_id', householdId).lte('cycle_start', currentDateStr).gte('cycle_end', currentDateStr).maybeSingle(),
        isToday
          ? supabase.from('appliance_readings').select('device_id, kwh_consumed, duration_minutes, session_start, session_end').eq('household_id', householdId).or(`session_end.is.null,and(session_start.gte.${windowStartStr},session_start.lte.${windowEndStr})`)
          : Promise.resolve({ data: [] }),
        // ── NEW: Fetch latest completed and open sessions for ALL devices ──
        supabase.from('appliance_readings').select('device_id, session_start, session_end, kwh_consumed').eq('household_id', householdId).not('session_end', 'is', null).order('device_id').order('session_start', { ascending: false }),
        supabase.from('appliance_readings').select('device_id, session_start, kwh_consumed').eq('household_id', householdId).is('session_end', null).order('device_id').order('session_start', { ascending: false }),
        // ── NEW: Fetch last 100 sessions for detailed history ──
        supabase.from('appliance_readings').select('device_id, session_start, session_end, kwh_consumed, duration_minutes').eq('household_id', householdId).order('session_start', { ascending: false }).limit(100),
      ])

      // Group sessions by device for the detail view
      const sessionsByDevice = {}
      if (allSessionsResult.data) {
        for (const s of allSessionsResult.data) {
          if (!sessionsByDevice[s.device_id]) sessionsByDevice[s.device_id] = []
          if (sessionsByDevice[s.device_id].length < 10) {
            sessionsByDevice[s.device_id].push(s)
          }
        }
      }

      // Parse the batch session results (manually simulate DISTINCT ON since Supabase client doesn't support it directly in select)
      const allLastCompleted = {}
      if (allLastCompletedResult.data) {
        for (const s of allLastCompletedResult.data) {
          if (!allLastCompleted[s.device_id]) allLastCompleted[s.device_id] = s
        }
      }
      const allOpenSessions = {}
      if (allOpenSessionsResult.data) {
        for (const s of allOpenSessionsResult.data) {
          if (!allOpenSessions[s.device_id]) allOpenSessions[s.device_id] = s
        }
      }

      // Billing Cycle — fetch daily_reports rows for the full cycle period
      const billingHistoryResult = (viewMode === 'Billing Cycle' && billingCycleResult.data?.cycle_start)
        ? await supabase
            .from('daily_reports')
            .select('report_date, total_kwh, device_type_breakdown')
            .eq('household_id', householdId)
            .gte('report_date', billingCycleResult.data.cycle_start)
            .lte('report_date', currentDateStr)
            .order('report_date', { ascending: false })
        : { data: [] }

      if (todayReportResult.error)    throw todayReportResult.error
      if (weeklyHistoryResult.error)  throw weeklyHistoryResult.error
      if (billingHistoryResult.error) throw billingHistoryResult.error
      if (todaySessionsResult.error)  throw todaySessionsResult.error

      let finalReport = todayReportResult.data
      const latestReport = finalReport || weeklyHistoryResult.data?.[0] || null

      console.log('[useHomeData] todayReport raw:', finalReport)

      // ── 4. Build device name map from recent reports (id → {name, type}) ──
      // Used by Daily live aggregation and Billing Cycle to resolve device names.
      const deviceNameMap = {}
      for (const report of weeklyHistoryResult.data ?? []) {
        let bd = {}
        try { bd = typeof report.device_type_breakdown === 'string' ? JSON.parse(report.device_type_breakdown) : (report.device_type_breakdown ?? {}) } catch (e) { /* skip */ }
        const devs = bd.today || bd.by_device || bd.by_type || {}
        for (const [id, d] of Object.entries(devs)) {
          if (!deviceNameMap[id]) deviceNameMap[id] = { name: d.name, type: d.type }
        }
      }

      // ── 4a. Device aggregation ────────────────────────────────────────────
      // Daily  → live from appliance_readings (6am IST window)
      // Weekly → sum across last-7 daily_reports device_type_breakdown
      // Billing→ handled separately in 4b

      let liveTodayKwh = 0
      let devices = []

      if (viewMode === 'Daily') {
        if (isToday) {
          // ── Live aggregation from appliance_readings ────────────────────────
          const liveAggregated = {}
          for (const s of todaySessionsResult.data ?? []) {
            const id = s.device_id
            if (!liveAggregated[id]) {
              liveAggregated[id] = {
                device_id: id,
                name:    deviceNameMap[id]?.name ?? id,
                type:    deviceNameMap[id]?.type ?? 'others',
                kwh:     0,
                cost:    0,
                minutes: 0,
              }
            }
            liveAggregated[id].kwh     += parseFloat(s.kwh_consumed   ?? 0)
            liveAggregated[id].minutes += parseInt(s.duration_minutes  ?? 0, 10)
            liveAggregated[id].lastCompleted = allLastCompleted[id] || null
            liveAggregated[id].openSession = allOpenSessions[id] || null
          }
          devices = Object.values(liveAggregated)
            .filter(d => d.kwh > 0.01 || d.minutes > 0)
            .sort((a, b) => b.kwh - a.kwh)
          liveTodayKwh = devices.reduce((s, d) => s + d.kwh, 0)
          console.log(`[useHomeData] Daily live: ${todaySessionsResult.data?.length ?? 0} sessions → ${liveTodayKwh.toFixed(3)} kWh`)
        } else {
          // ── Past date aggregation from daily_reports ─────────────────────────
          if (finalReport) {
            let bd = {}
            try { bd = typeof finalReport.device_type_breakdown === 'string' ? JSON.parse(finalReport.device_type_breakdown) : (finalReport.device_type_breakdown ?? {}) } catch (e) { }
            
            const pastAggregated = {}
            const itemsToProcess = []
            
            const devs = bd.today || bd.by_device || bd.by_type || {}
            Object.entries(devs).forEach(([id, d]) => itemsToProcess.push({ ...d, device_id: id }))
            if (Array.isArray(bd.carried_over)) {
              bd.carried_over.forEach(d => itemsToProcess.push({ ...d, device_id: d.device_id || d.name }))
            }
            
            for (const d of itemsToProcess) {
              const id = d.device_id
              if (!pastAggregated[id]) pastAggregated[id] = { device_id: id, name: deviceNameMap[id]?.name || d.name || d.type || id, type: deviceNameMap[id]?.type || d.type || 'others', kwh: 0, cost: 0, minutes: 0 }
              pastAggregated[id].kwh += parseFloat(d.kwh || 0)
              pastAggregated[id].cost += parseFloat(d.cost || 0)
              pastAggregated[id].minutes += parseInt(d.minutes || 0, 10)
              pastAggregated[id].lastCompleted = allLastCompleted[id] || null
              pastAggregated[id].openSession = allOpenSessions[id] || null
            }
            devices = Object.values(pastAggregated).filter(d => d.kwh > 0.01 || d.minutes > 0).sort((a, b) => b.kwh - a.kwh)
            liveTodayKwh = parseFloat(finalReport.total_kwh || 0)
          } else {
            devices = []
            liveTodayKwh = 0
          }
        }
      } else if (viewMode === 'Weekly') {
        const aggregated = {}
        for (const report of weeklyHistoryResult.data ?? []) {
          if (!report) continue
          let breakdown = {}
          try {
            const raw = report.device_type_breakdown
            breakdown = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
          } catch (e) { continue }

          const itemsToProcess = []
          const devicesMap = breakdown.today || breakdown.by_device || breakdown.by_type || {}
          Object.entries(devicesMap).forEach(([id, d]) => itemsToProcess.push({ ...d, device_id: id }))
          if (Array.isArray(breakdown.carried_over)) {
            breakdown.carried_over.forEach(d => itemsToProcess.push({ ...d, device_id: d.device_id || d.name }))
          }

          let reportRecognizedKwh = 0
          for (const d of itemsToProcess) {
            const id = d.device_id
            if (!aggregated[id]) aggregated[id] = { device_id: id, name: d.name || d.type || id, type: d.type || 'others', kwh: 0, cost: 0, minutes: 0, last_active_at: null, last_session_kwh: null, sessions: [], weekData: [] }
            const kwhVal = parseFloat(d.kwh || 0)
            aggregated[id].kwh     += kwhVal
            aggregated[id].cost    += parseFloat(d.cost    || 0)
            aggregated[id].minutes += parseInt(d.minutes   || 0, 10)
            
            // Inject latest sessions
            aggregated[id].lastCompleted = allLastCompleted[id] || null
            aggregated[id].openSession = allOpenSessions[id] || null
            aggregated[id].sessions = sessionsByDevice[id] || []

            // Build weekData history
            const reportDate = new Date(report.report_date)
            aggregated[id].weekData.unshift({
              day: reportDate.getDate().toString(),
              kwh: kwhVal,
              mins: parseInt(d.minutes || 0, 10),
              date: report.report_date
            })

            // Track last active date from reports
            if (!aggregated[id].last_active_at || reportDate > new Date(aggregated[id].last_active_at)) {
              aggregated[id].last_active_at = report.report_date
            }

            reportRecognizedKwh    += kwhVal
          }
          const unassigned = parseFloat(report.total_kwh || 0) - reportRecognizedKwh
          if (unassigned > 0.01) {
            if (!aggregated['unassigned_other']) aggregated['unassigned_other'] = { device_id: 'unassigned_other', name: 'Other / Unassigned', type: 'others', kwh: 0, cost: 0, minutes: 0, sessions: [], weekData: [] }
            aggregated['unassigned_other'].kwh += unassigned
          }
        }
        
        // ── Merge Live Today Data into Weekly ─────────────────────────────
        if (isToday && todaySessionsResult.data?.length) {
          for (const s of todaySessionsResult.data) {
            const id = s.device_id
            if (!aggregated[id]) aggregated[id] = { device_id: id, name: deviceNameMap[id]?.name ?? id, type: deviceNameMap[id]?.type ?? 'others', kwh: 0, cost: 0, minutes: 0, last_active_at: null, last_session_kwh: null }
            aggregated[id].kwh     += parseFloat(s.kwh_consumed   ?? 0)
            aggregated[id].minutes += parseInt(s.duration_minutes  ?? 0, 10)

            // Track last active time and its kWh
            const sessionTime = s.session_end ?? s.session_start
            const currentSessionKwh = parseFloat(s.kwh_consumed ?? 0)
            if (sessionTime && (!aggregated[id].last_active_at || new Date(sessionTime) > new Date(aggregated[id].last_active_at))) {
              aggregated[id].last_active_at = sessionTime
              aggregated[id].last_session_kwh = currentSessionKwh
            }
            aggregated[id].lastCompleted = allLastCompleted[id] || null
            aggregated[id].openSession = allOpenSessions[id] || null
            
            if (s.session_end === null) {
              aggregated[id].is_currently_active = true
            }
          }
        }
        devices = Object.values(aggregated).filter(d => d.kwh > 0.01 || d.minutes > 0).sort((a, b) => b.kwh - a.kwh)
      }

      // ── 4b. Billing Cycle — aggregate device_type_breakdown from daily_reports ─
      // Sums every daily_report row in the billing period, excludes geysers,
      // returns the top 3 devices by kWh consumed.
      let billingSessions = 0
      if (viewMode === 'Billing Cycle') {
        const billingAggregated = {}

        for (const report of billingHistoryResult.data ?? []) {
          if (!report) continue
          billingSessions += parseInt(report.total_sessions || 0, 10)

          let breakdown = {}
          try {
            const raw = report.device_type_breakdown
            breakdown = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
          } catch (e) { continue }

          const itemsToProcess = []

          // today / by_device entries
          const devicesMap = breakdown.today || breakdown.by_device || {}
          Object.entries(devicesMap).forEach(([id, d]) => {
            itemsToProcess.push({ ...d, device_id: id })
          })

          // carried_over entries
          if (Array.isArray(breakdown.carried_over)) {
            breakdown.carried_over.forEach(d => {
              itemsToProcess.push({ ...d, device_id: d.device_id || d.name })
            })
          }

          for (const d of itemsToProcess) {
            const id = d.device_id
            if (!billingAggregated[id]) {
              billingAggregated[id] = {
                device_id: id,
                name: d.name || id,
                type: d.type || 'others',
                kwh: 0,
                cost: 0,
                minutes: 0,
              }
            }
            billingAggregated[id].kwh     += parseFloat(d.kwh     || 0)
            billingAggregated[id].cost    += parseFloat(d.cost    || 0)
            billingAggregated[id].minutes += parseInt(d.minutes   || 0, 10)
          }
        }

        // Exclude geyser, return top 3 by kWh
        devices = Object.values(billingAggregated)
          .filter(d => d.kwh > 0.01 && d.type !== 'geyser')
          .sort((a, b) => b.kwh - a.kwh)
          .slice(0, 3)

        console.log('[useHomeData] Billing Cycle devices from daily_reports:',
          devices.map(d => `${d.name}: ${d.kwh.toFixed(2)} kWh`))
      }

      console.log(`[useHomeData] ${viewMode} devices:`, devices.length, '| Total kWh:', devices.reduce((s, d) => s + d.kwh, 0).toFixed(3))

      // ── 5. Parse weather ──────────────────────────────────────────────────
      let weather = null
      try {
        const raw = latestReport?.weather_context
        weather = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? null)
      } catch (e) {
        console.warn('[useHomeData] weather_context parse failed:', e)
      }

      // ── 6. Open sessions computed live from appliance_readings ───────────
      const openSessions = (todaySessionsResult.data ?? [])
        .filter(s => s.session_end === null)
        .map(s => ({
          device_id: s.device_id,
          name: deviceNameMap[s.device_id]?.name ?? s.device_id,
          started_ist: new Date(s.session_start)
            .toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata'
            })
        }))

      // ── 7. Weekly aggregation (if viewMode === 'Weekly') ─────────────────
      let weeklyKwh = 0
      let weeklySessions = 0
      if (viewMode === 'Weekly' && weeklyHistoryResult.data?.length) {
        weeklyKwh = weeklyHistoryResult.data.reduce((sum, r) => sum + parseFloat(r.total_kwh ?? 0), 0)
        weeklySessions = weeklyHistoryResult.data.reduce((sum, r) => sum + parseInt(r.total_sessions ?? 0, 10), 0)
        
        if (isToday) {
          weeklyKwh += liveTodayKwh
          weeklySessions += (todaySessionsResult.data?.length ?? 0)
        }
        console.log('[useHomeData] weeklyKwh (with live):', weeklyKwh)
      }

      const liveTodayMins = (todaySessionsResult.data ?? []).reduce((s, x) => s + parseInt(x.duration_minutes || 0, 10), 0)

      // ── 8. Billing cycle data ─────────────────────────────────────────────
      // Priority: billing_cycle_summary table → fall back to values embedded in daily_report
      const billingCycleRow = billingCycleResult?.data ?? null

      const cycleStartRaw = billingCycleRow?.cycle_start ?? null
      const cycleEndRaw = billingCycleRow?.cycle_end ?? null

      // kwh_accumulated: prefer billing_cycle_summary.kwh_accumulated, then cumulative_kwh, else report's cycle_measured_kwh_after
      const kwhAccumulated =
        parseFloat(billingCycleRow?.kwh_accumulated ?? billingCycleRow?.cumulative_kwh ?? latestReport?.cycle_measured_kwh_after ?? 0)
      
      const multiplier = 1.67
      const calculatedEstimate = parseFloat((kwhAccumulated * multiplier).toFixed(2))
      const dbEstimate = parseFloat(billingCycleRow?.estimated_kwh ?? latestReport?.cycle_estimated_after ?? 0)
      
      // Use the higher of the two to ensure Slab indicators trigger accurately
      const kwhEstimated = Math.max(dbEstimate, calculatedEstimate)


      // ── 9. Resolve display kwh by viewMode ────────────────────────────────
      const displayKwh =
        viewMode === 'Weekly'        ? weeklyKwh :
        viewMode === 'Billing Cycle' ? kwhAccumulated :
        /* Daily — live sum from appliance_readings */   liveTodayKwh

      console.log('[useHomeData] displayKwh:', displayKwh, '| viewMode:', viewMode)
      console.log('[useHomeData] billing kwh_accumulated:', kwhAccumulated)

      const chartData = (weeklyHistoryResult.data ?? []).reverse()

      let reportObj = latestReport ?? null
      if (!isToday && !finalReport) {
        reportObj = {
          tip_text: 'No data recorded for this date',
          total_kwh: 0,
          estimated_full_home_kwh: 0,
          estimated_cost_inr: 0,
          total_sessions: 0,
          report_date: currentDateStr,
        }
      }

      // ── ESTIMATES LOGIC ──
      const mode = viewMode.toLowerCase()
      
      function calcTNEBCost(units) {
        if (units <= 0) return 0
        let cost = 0
        if (units > 100) cost += Math.min(units - 100, 100) * 2.35  // Slab 2: 101–200
        if (units > 200) cost += Math.min(units - 200, 200) * 4.70  // Slab 3: 201–400
        if (units > 400) cost += Math.min(units - 400, 100) * 6.30  // Slab 4: 401–500
        return Math.round(cost)
      }

      function getCurrentSlab(units) {
        if (units <= 100) return { slab: 1, rate: 0,    label: 'Free' }
        if (units <= 200) return { slab: 2, rate: 2.35, label: '₹2.35/unit' }
        if (units <= 400) return { slab: 3, rate: 4.70, label: '₹4.70/unit' }
        return                   { slab: 4, rate: 6.30, label: '₹6.30/unit' }
      }

      function calcMarginalCost(additionalKwh, cycleUnitsAlready) {
        if (additionalKwh <= 0) return 0
        const totalAfter = cycleUnitsAlready + additionalKwh
        const costAfter  = calcTNEBCost(totalAfter)
        const costBefore = calcTNEBCost(cycleUnitsAlready)
        return Math.max(0, costAfter - costBefore)
      }

      const cycleUnits = kwhAccumulated
      let estimatedFullHomeKwh = 0
      let estimatedCostInr = 0

      const MULTIPLIER = 1.67
      if (mode === 'daily') {
        const dailyEstimatedKwh = parseFloat((liveTodayKwh * MULTIPLIER).toFixed(2))
        estimatedFullHomeKwh = dailyEstimatedKwh
        estimatedCostInr = calcMarginalCost(dailyEstimatedKwh, cycleUnits)
      } else if (mode === 'weekly') {
        const weeklyEstimatedKwh = parseFloat((weeklyKwh * MULTIPLIER).toFixed(2))
        estimatedFullHomeKwh = weeklyEstimatedKwh
        estimatedCostInr = calcMarginalCost(weeklyEstimatedKwh, cycleUnits)
      } else if (mode === 'billing cycle') {
        estimatedFullHomeKwh = kwhEstimated
        estimatedCostInr = calcTNEBCost(estimatedFullHomeKwh)
      }

      const currSlab = getCurrentSlab(kwhEstimated)

      // ── 11. Compose final state ───────────────────────────────────────────
      setData({
        today: {
          total_kwh: displayKwh,
          raw_kwh: parseFloat(latestReport?.total_kwh ?? 0),
          live_kwh: liveTodayKwh,
          live_sessions: todaySessionsResult.data?.length ?? 0,
          live_runtime: liveTodayMins,
          estimated_full_home_kwh: estimatedFullHomeKwh,
          estimated_cost_inr: estimatedCostInr,
          session_count: mode === 'weekly' ? weeklySessions : mode === 'billing cycle' ? billingSessions : (todaySessionsResult.data?.length ?? 0),
          devices,
          device_breakdown_note: viewMode === 'Billing Cycle'
            ? 'Device breakdown from Apr 14 · plug installation date'
            : null,
          open_sessions: openSessions,
          energy_vs_last_week: latestReport?.energy_vs_last_week ?? null,
          as_of_ist: activeDate.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit',
          }),
          report_date: viewMode === 'Daily' ? currentDateStr : (latestReport?.report_date ?? currentDateStr),
          is_fallback: viewMode === 'Daily' ? false : (!finalReport || parseFloat(latestReport?.total_kwh ?? 0) === 0),
        },
        billing: {
          kwh_accumulated: kwhAccumulated,
          kwh_estimated: kwhEstimated,
          slab_crossing_date: latestReport?.slab_crossing_date ?? null,
          slab_crossing_units: latestReport?.slab_crossing_units ?? null,
          cycle_start: cycleStartRaw,
          cycle_end: cycleEndRaw,
          current_slab_name: `Slab ${currSlab.slab}`,
          current_slab_rate: currSlab.rate,
          current_slab_label: currSlab.label,
          slab_status: kwhEstimated <= 500 ? [
            { name: 'Slab 1', rate: 'Free', status: kwhEstimated > 100 ? 'Done ✓' : 'Now', active: kwhEstimated <= 100 },
            { name: 'Slab 2', rate: '₹2.35', status: kwhEstimated > 200 ? 'Done ✓' : kwhEstimated > 100 ? 'Now' : '101–200', active: kwhEstimated > 100 && kwhEstimated <= 200 },
            { name: 'Slab 3', rate: '₹4.70', status: kwhEstimated > 400 ? 'Done ✓' : kwhEstimated > 200 ? 'Now' : '201–400', active: kwhEstimated > 200 && kwhEstimated <= 400 },
            { name: 'Slab 4', rate: '₹6.30', status: kwhEstimated > 400 ? 'Now' : '401–500', active: kwhEstimated > 400 },
          ] : [
            { name: 'Slab 5', rate: '₹8.40', status: kwhEstimated > 600 ? 'Done ✓' : kwhEstimated > 500 ? 'Now' : '501–600', active: kwhEstimated > 500 && kwhEstimated <= 600 },
            { name: 'Slab 6', rate: '₹9.45', status: kwhEstimated > 800 ? 'Done ✓' : kwhEstimated > 600 ? 'Now' : '601–800', active: kwhEstimated > 600 && kwhEstimated <= 800 },
            { name: 'Slab 7', rate: '₹10.50', status: kwhEstimated >= 800 ? 'Now' : '801–1000', active: kwhEstimated > 800 },
          ]
        },
        chartData,
        weather,
        report: reportObj,
      })
    } catch (err) {
      setError(err)
      console.error('[useHomeData] fatal error:', err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchAll }
}