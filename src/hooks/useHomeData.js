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
    setData(null)
    setError(null)

    try {
      const activeDate = selectedDate ? new Date(`${selectedDate}T23:59:59`) : new Date()

      const toLocalISO = (date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      const toISTDate = (iso) => {
        if (!iso) return null
        // Using toLocaleString trick to resolve IST date string correctly
        const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        return toLocalISO(d)
      }

      const currentDateStr = toLocalISO(activeDate)
      const todayRealStr = toLocalISO(new Date())
      const isToday = currentDateStr === todayRealStr

      // Rolling 14-day window (Today - 13 days)
      const rollingStart = new Date(activeDate)
      rollingStart.setDate(activeDate.getDate() - 13)
      rollingStart.setHours(0, 0, 0, 0)
      const rollingStartStr = toLocalISO(rollingStart)
      const rollingEndStr = currentDateStr

      // 6:00 AM IST window for Daily live data
      const windowStart = new Date(activeDate)
      windowStart.setHours(6, 0, 0, 0)
      if (activeDate < windowStart) windowStart.setDate(windowStart.getDate() - 1)
      const windowStartStr = windowStart.toISOString()
      const windowEndStr = activeDate.toISOString()

      // 1. Parallel Queries
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
        supabase.from('daily_reports').select('*').eq('household_id', householdId).gte('report_date', rollingStartStr).lte('report_date', rollingEndStr).order('report_date', { ascending: true }),
        supabase.from('billing_cycle_summary').select('*').eq('household_id', householdId).lte('cycle_start', currentDateStr).gte('cycle_end', currentDateStr).maybeSingle(),
        isToday
          ? supabase.from('appliance_readings').select('*').eq('household_id', householdId).or(`session_end.is.null,session_start.gte.${windowStartStr}`)
          : Promise.resolve({ data: [] }),
        supabase.from('appliance_readings').select('*').eq('household_id', householdId).not('session_end', 'is', null).order('device_id').order('session_start', { ascending: false }),
        supabase.from('appliance_readings').select('*').eq('household_id', householdId).is('session_end', null).order('device_id').order('session_start', { ascending: false }),
        // Fetch ALL sessions for the rolling 7-day window (explicit IST boundaries)
        supabase.from('appliance_readings')
          .select('*')
          .eq('household_id', householdId)
          .gte('session_start', new Date(rollingStartStr + 'T00:00:00+05:30').toISOString())
          .lte('session_start', new Date(rollingEndStr + 'T23:59:59+05:30').toISOString())
          .order('session_start', { ascending: false }),
      ])

      // 2. Pre-processing
      const deviceNameMap = {}
      const fillMeta = (bd) => {
        const devs = bd.today || bd.by_device || bd.by_type || {}
        Object.entries(devs).forEach(([id, d]) => { if (!deviceNameMap[id]) deviceNameMap[id] = { name: d.name, type: d.type } })
      }
      weeklyHistoryResult.data?.forEach(r => {
        try { fillMeta(typeof r.device_type_breakdown === 'string' ? JSON.parse(r.device_type_breakdown) : (r.device_type_breakdown || {})) } catch (e) { }
      })
      if (todayReportResult.data) {
        try { fillMeta(typeof todayReportResult.data.device_type_breakdown === 'string' ? JSON.parse(todayReportResult.data.device_type_breakdown) : todayReportResult.data.device_type_breakdown) } catch (e) { }
      }

      const sessionsByDevice = {}
      if (allSessionsResult.data) {
        allSessionsResult.data.forEach(s => {
          if (!sessionsByDevice[s.device_id]) sessionsByDevice[s.device_id] = []
          if (sessionsByDevice[s.device_id].length < 15) sessionsByDevice[s.device_id].push(s)
        })
      }

      const allLastCompleted = {}
      if (allLastCompletedResult.data) {
        allLastCompletedResult.data.forEach(s => { if (!allLastCompleted[s.device_id]) allLastCompleted[s.device_id] = s })
      }
      const allOpenSessions = {}
      if (allOpenSessionsResult.data) {
        allOpenSessionsResult.data.forEach(s => { if (!allOpenSessions[s.device_id]) allOpenSessions[s.device_id] = s })
      }

      // 3. Aggregation Logic
      let devices = []
      let liveTodayKwh = 0
      let displayKwh = 0
      let totalHomeSessions = 0

      if (viewMode === 'Daily') {
        const aggregated = {}
        const finalReport = todayReportResult.data
        if (finalReport) {
          const bd = typeof finalReport.device_type_breakdown === 'string' ? JSON.parse(finalReport.device_type_breakdown) : finalReport.device_type_breakdown
          const devs = bd.today || bd.by_device || bd.by_type || {}
          Object.entries(devs).forEach(([id, d]) => {
            const resolvedName = deviceNameMap[id]?.name || d.name
            if (!resolvedName || resolvedName === id) return  // skip unresolvable devices
            aggregated[id] = { device_id: id, name: resolvedName, type: d.type || 'others', kwh: parseFloat(d.kwh || 0), minutes: parseInt(d.minutes || 0, 10), session_count: parseInt(d.sessions || 0, 10) }
          })
          totalHomeSessions = parseInt(finalReport.total_sessions || 0, 10)
        }
        if (isToday && todaySessionsResult.data) {
          todaySessionsResult.data.forEach(s => {
            const id = s.device_id
            const resolvedName = deviceNameMap[id]?.name
            if (!resolvedName || resolvedName === id) return  // skip unresolvable devices
            if (!aggregated[id]) aggregated[id] = { device_id: id, name: resolvedName, type: deviceNameMap[id]?.type || 'others', kwh: 0, minutes: 0, session_count: 0 }
            aggregated[id].kwh += parseFloat(s.kwh_consumed || 0)
            aggregated[id].minutes += parseInt(s.duration_minutes || 0, 10)
            aggregated[id].session_count += 1
          })
          totalHomeSessions = todaySessionsResult.data.length
        }
        devices = Object.values(aggregated).filter(d => d.kwh > 0.001 || d.minutes > 0).sort((a, b) => b.kwh - a.kwh)
        liveTodayKwh = devices.reduce((s, d) => s + d.kwh, 0)
        displayKwh = isToday ? liveTodayKwh : parseFloat(finalReport?.total_kwh || 0)
      } else if (viewMode === 'Weekly') {
        const weekTemplate = []
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for (let i = 0; i < 7; i++) {
          const d = new Date(rollingStart)
          d.setDate(rollingStart.getDate() + i)
          weekTemplate.push({
            date: toLocalISO(d),
            day: dayNames[d.getDay()],
            kwh: 0,
            mins: 0
          })
        }

        const aggregated = {}
        if (allSessionsResult.data) {
          allSessionsResult.data.forEach(s => {
            const istDate = toISTDate(s.session_start)
            if (istDate < rollingStartStr || istDate > rollingEndStr) return

            const id = s.device_id
            const resolvedName = deviceNameMap[id]?.name
            if (!resolvedName || resolvedName === id) return  // skip unresolvable devices
            if (!aggregated[id]) {
              aggregated[id] = {
                device_id: id, name: resolvedName, type: deviceNameMap[id]?.type || 'others',
                kwh: 0, minutes: 0, session_count: 0, sessions: sessionsByDevice[id] || [],
                weekData: JSON.parse(JSON.stringify(weekTemplate))
              }
            }
            const kwh = parseFloat(s.kwh_consumed || 0)
            const mins = parseInt(s.duration_minutes || 0, 10)
            aggregated[id].kwh += kwh
            aggregated[id].minutes += mins
            aggregated[id].session_count += 1

            const bar = aggregated[id].weekData.find(w => w.date === istDate)
            if (bar) { bar.kwh += kwh; bar.mins += mins }
          })
        }

        displayKwh = (weeklyHistoryResult.data || []).reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0)
        if (isToday && !todayReportResult.data) displayKwh += todaySessionsResult.data?.reduce((s, x) => s + parseFloat(x.kwh_consumed || 0), 0) || 0
        totalHomeSessions = Object.values(aggregated).reduce((s, d) => s + d.session_count, 0)

        // Unassigned/Other — removed: no longer synthesizing an 'Other' bucket
        devices = Object.values(aggregated).filter(d => d.kwh > 0.01 || d.minutes > 0).sort((a, b) => b.kwh - a.kwh)
      } else if (viewMode === 'Billing Cycle') {
        const billingHistoryResult = (billingCycleResult.data?.cycle_start)
          ? await supabase.from('daily_reports').select('*').eq('household_id', householdId).gte('report_date', billingCycleResult.data.cycle_start).lte('report_date', currentDateStr)
          : { data: [] }
        const billingAggregated = {}
        let bSessions = 0
        billingHistoryResult.data?.forEach(report => {
          bSessions += parseInt(report.total_sessions || 0, 10)
          let bd = {}
          try { bd = typeof report.device_type_breakdown === 'string' ? JSON.parse(report.device_type_breakdown) : (report.device_type_breakdown || {}) } catch (e) { return }
          const devs = bd.today || bd.by_device || bd.by_type || {}
          Object.entries(devs).forEach(([id, d]) => {
            const resolvedName = deviceNameMap[id]?.name || d.name
            if (!resolvedName || resolvedName === id) return  // skip unresolvable devices
            if (!billingAggregated[id]) billingAggregated[id] = { device_id: id, name: resolvedName, type: d.type || 'others', kwh: 0, minutes: 0, session_count: 0 }
            billingAggregated[id].kwh += parseFloat(d.kwh || 0)
            billingAggregated[id].minutes += parseInt(d.minutes || 0, 10)
            billingAggregated[id].session_count += parseInt(d.sessions || 0, 10)
          })
        })
        devices = Object.values(billingAggregated).filter(d => d.kwh > 0.01 && d.type !== 'geyser').sort((a, b) => b.kwh - a.kwh).slice(0, 3)
        displayKwh = parseFloat(billingCycleResult.data?.kwh_accumulated ?? 0)
        totalHomeSessions = bSessions
      }

      devices.forEach(d => {
        d.totalKwh = d.kwh
        d.totalSessions = d.session_count
        d.totalMins = d.minutes
        d.lastCompleted = allLastCompleted[d.device_id] || null
        d.openSession = allOpenSessions[d.device_id] || null
        if (d.openSession) d.is_currently_active = true
      })
      const latestReport = todayReportResult.data || weeklyHistoryResult.data?.[0]
      let weather = null
      try { weather = typeof latestReport?.weather_context === 'string' ? JSON.parse(latestReport.weather_context) : (latestReport?.weather_context ?? null) } catch (e) { }
      const kwhAccumulated = parseFloat(billingCycleResult.data?.kwh_accumulated ?? 0)
      const kwhEstimated = kwhAccumulated * 1.67

      // 4. Slab Calculation (TNEB)
      const generateSlabStatus = (measured, estimated) => {
        const isPart2 = estimated > 500
        const slabs = isPart2 
          ? [
              { name: 'Slab 1', range: '0–100', rate: 'Free', limit: 100 },
              { name: 'Slab 2', range: '101–400', rate: '₹4.70', limit: 400 },
              { name: 'Slab 3', range: '401–500', rate: '₹6.30', limit: 500 },
              { name: 'Slab 4', range: '501–600', rate: '₹8.40', limit: 600 },
              { name: 'Slab 5', range: '601–800', rate: '₹9.45', limit: 800 },
              { name: 'Slab 6', range: '801–1000', rate: '₹10.50', limit: 1000 },
            ]
          : [
              { name: 'Slab 1', range: '0–100', rate: 'Free', limit: 100 },
              { name: 'Slab 2', range: '101–200', rate: '₹2.35', limit: 200 },
              { name: 'Slab 3', range: '201–400', rate: '₹4.70', limit: 400 },
              { name: 'Slab 4', range: '401–500', rate: '₹6.30', limit: 500 },
            ]

        let currentSlabIdx = slabs.findIndex(s => estimated < s.limit)
        if (currentSlabIdx === -1) currentSlabIdx = slabs.length - 1

        return slabs.map((s, idx) => {
          const prevLimit = idx === 0 ? 0 : slabs[idx-1].limit
          const slabMeasured = Math.max(0, Math.min(measured - prevLimit, s.limit - prevLimit))
          const fillPct = Math.round((slabMeasured / (s.limit - prevLimit)) * 100)
          
          return {
            ...s,
            active: idx === currentSlabIdx,
            status: idx < currentSlabIdx ? 'Done ✓' : (idx === currentSlabIdx ? 'Now' : s.range),
            fillPct
          }
        })
      }

      const slabStatus = generateSlabStatus(kwhAccumulated, kwhEstimated)
      const currentSlab = slabStatus.find(s => s.active)

      setData({
        today: {
          total_kwh: displayKwh, live_kwh: liveTodayKwh, live_sessions: todaySessionsResult.data?.length ?? 0,
          session_count: totalHomeSessions,
          devices, open_sessions: (todaySessionsResult.data || []).filter(s => !s.session_end).map(s => ({ device_id: s.device_id, name: deviceNameMap[s.device_id]?.name || s.device_id, started_ist: new Date(s.session_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) })),
          estimated_full_home_kwh: kwhEstimated, estimated_cost_inr: viewMode === 'Billing Cycle' ? 0 : 0, 
          report_date: currentDateStr, as_of_ist: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        },
        billing: { 
          kwh_accumulated: kwhAccumulated, 
          kwh_estimated: kwhEstimated, 
          cycle_start: billingCycleResult.data?.cycle_start, 
          cycle_end: billingCycleResult.data?.cycle_end,
          slab_status: slabStatus,
          current_slab_name: currentSlab?.name,
          current_slab_rate: currentSlab?.rate
        },
        weather, report: latestReport,
        history: weeklyHistoryResult.data || []
      })
    } catch (err) { setError(err); console.error(err) } finally { setLoading(false) }
  }

  return { data, loading, error, refetch: fetchAll }
}