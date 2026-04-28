import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine, Label 
} from 'recharts'
import { supabase } from '../lib/supabase'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#fff', border: '0.5px solid #E8E4DE', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: '#1A1916', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#6B6860', fontWeight: 500 }}>{d.kwh?.toFixed(2)} kWh</div>
      {d.sessions != null && <div style={{ color: '#A8A59E' }}>{d.sessions} sessions</div>}
      {d.cost != null && d.cost > 0 && <div style={{ color: '#D4880A' }}>~₹{d.cost} est.</div>}
    </div>
  )
}

export default function EnergyGraph({ viewMode, householdId, cycleStart, cycleEnd, slabCrossingDate, selectedDate }) {
  const [graphData, setGraphData] = useState([])
  const [billingSubMode, setBillingSubMode] = useState('day') // 'day' | 'week'
  const [loading, setLoading] = useState(true)

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchGraphData()
  }, [viewMode, householdId, selectedDate, cycleStart, cycleEnd, billingSubMode])

  async function fetchGraphData() {
    setLoading(true)
    try {
      if (viewMode === 'Daily') {
        const date = new Date(selectedDate)
        const dateStr = date.toISOString().split('T')[0]
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        const windowStart = `${dateStr}T00:30:00Z` // 6AM IST
        const windowEnd = `${nextDateStr}T00:30:00Z`

        const { data: sessions, error } = await supabase
          .from('appliance_readings')
          .select('session_start, session_end, kwh_consumed, duration_minutes, device_id')
          .eq('household_id', householdId)
          .or(`session_end.is.null,and(session_start.gte.${windowStart},session_start.lt.${windowEnd})`)

        if (error) throw error

        const hours = []
        for (let h = 6; h <= 30; h++) {
          const label = h <= 23
            ? `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`
            : `${h - 24 > 0 ? h - 24 : 12}AM`
          hours.push({ label, hour: h % 24, kwh: 0, sessions: 0 })
        }

        sessions.forEach(session => {
          const startHour = new Date(session.session_start)
            .toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })
          const h = parseInt(startHour)
          const bucket = h >= 6 ? h - 6 : h + 18
          if (hours[bucket]) {
            hours[bucket].kwh += parseFloat(session.kwh_consumed || 0)
            hours[bucket].sessions += 1
          }
        })
        setGraphData(hours)

      } else if (viewMode === 'Weekly') {
        const d = new Date(selectedDate + 'T00:00:00')
        const day = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
        
        // Find Monday of the week containing selectedDate
        const diff = (day === 0 ? -6 : 1) - day
        const monday = new Date(d)
        monday.setDate(d.getDate() + diff)
        
        const dStartStr = monday.toISOString().split('T')[0]
        const dEnd = new Date(monday)
        dEnd.setDate(dEnd.getDate() + 6)
        const dEndStr = dEnd.toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('daily_reports')
          .select('report_date, total_kwh, total_sessions, estimated_cost_inr')
          .eq('household_id', householdId)
          .gte('report_date', dStartStr)
          .lte('report_date', dEndStr)
          .order('report_date', { ascending: true })

        if (error) throw error

        const fullWeek = []
        const curr = new Date(monday)
        for (let i = 0; i < 7; i++) {
          const dStr = curr.toISOString().split('T')[0]
          const record = data.find(r => r.report_date === dStr)
          fullWeek.push({
            label: curr.toLocaleDateString('en-IN', { weekday: 'short' }),
            kwh: record ? record.total_kwh : 0,
            sessions: record ? record.total_sessions : 0,
            cost: record ? record.estimated_cost_inr : 0,
            isToday: dStr === todayStr,
            report_date: dStr
          })
          curr.setDate(curr.getDate() + 1)
        }
        setGraphData(fullWeek)

      } else if (viewMode === 'Billing Cycle') {
        const endDay = new Date(selectedDate)
        const endDayStr = endDay.toISOString().split('T')[0]
        
        // For Billing Cycle, we show the full window (typically 60 days) 
        // to provide a perspective of the entire cycle.
        const finalEndStr = cycleEnd || endDayStr

        const { data, error } = await supabase
          .from('daily_reports')
          .select('report_date, total_kwh, total_sessions, estimated_cost_inr')
          .eq('household_id', householdId)
          .gte('report_date', cycleStart)
          .lte('report_date', finalEndStr)
          .order('report_date', { ascending: true })

        if (error) throw error

        console.log('[EnergyGraph] Billing Cycle:', { cycleStart, finalEndStr, billingSubMode })

        if (billingSubMode === 'day') {
          const allDays = []
          
          const curr = new Date(cycleStart + 'T00:00:00')
          const limitStr = finalEndStr
          
          console.log('[EnergyGraph] Start loop:', { cycleStart, limitStr })

          let lastMonth = -1
          // Use string comparison safely
          while (true) {
            const y = curr.getFullYear()
            const m = (curr.getMonth() + 1).toString().padStart(2, '0')
            const d = curr.getDate().toString().padStart(2, '0')
            const dStr = `${y}-${m}-${d}`
            
            if (dStr > limitStr) break

            const record = data.find(r => r.report_date === dStr)
            
            const currentMonth = curr.getMonth()
            let label = curr.getDate().toString()
            if (currentMonth !== lastMonth || allDays.length === 0) {
              label = curr.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              lastMonth = currentMonth
            }

            allDays.push({
              label,
              kwh: record ? record.total_kwh : 0,
              sessions: record ? record.total_sessions : 0,
              cost: record ? record.estimated_cost_inr : 0,
              isToday: dStr === todayStr,
              report_date: dStr
            })
            
            curr.setDate(curr.getDate() + 1)
            if (allDays.length > 120) break 
          }
          console.log('[EnergyGraph] Loop finished. Total days:', allDays.length)
          setGraphData(allDays)
        } else {
          // Week-wise: 60 days cycle = ~8.5 weeks. Show at least 8.
          const weekBuckets = Array.from({ length: 9 }, (_, i) => ({
            label: `Week ${i + 1}`, kwh: 0, sessions: 0, cost: 0
          }))

          data.forEach(d => {
            const daysDiff = Math.floor((new Date(d.report_date) - new Date(cycleStart)) / (1000 * 60 * 60 * 24))
            const weekIdx = Math.floor(daysDiff / 7)
            if (weekBuckets[weekIdx]) {
              weekBuckets[weekIdx].kwh += d.total_kwh
              weekBuckets[weekIdx].sessions += d.total_sessions
              weekBuckets[weekIdx].cost += d.estimated_cost_inr
            }
          })
          setGraphData(weekBuckets)
        }

      } else if (viewMode === 'Yearly') {
        const year = new Date(selectedDate).getFullYear()
        const startOfYear = `${year}-01-01`
        const endOfYear = `${year}-12-31`

        const { data, error } = await supabase
          .from('daily_reports')
          .select('report_date, total_kwh, estimated_cost_inr')
          .eq('household_id', householdId)
          .gte('report_date', startOfYear)
          .lte('report_date', endOfYear)
          .order('report_date', { ascending: true })

        if (error) throw error

        const monthsMap = {}
        data.forEach(d => {
          const mKey = d.report_date.slice(0, 7) // "2026-04"
          if (!monthsMap[mKey]) {
            monthsMap[mKey] = { kwh: 0, cost: 0 }
          }
          monthsMap[mKey].kwh += d.total_kwh
          monthsMap[mKey].cost += d.estimated_cost_inr
        })

        const calendarYear = []
        for (let m = 0; m < 12; m++) {
          const mKey = `${year}-${(m + 1).toString().padStart(2, '0')}`
          const d = new Date(year, m, 1)
          calendarYear.push({
            label: d.toLocaleDateString('en-IN', { month: 'short' }),
            kwh: monthsMap[mKey]?.kwh || 0,
            cost: monthsMap[mKey]?.cost || 0
          })
        }
        setGraphData(calendarYear)
      }
    } catch (err) {
      console.error('Error fetching graph data:', err)
    } finally {
      setLoading(false)
    }
  }

  const maxKwh = Math.max(...graphData.map(d => d.kwh || 0), 2.5)
  const dynamicTicks = []
  for (let i = 0; i <= maxKwh + 1; i += 1) {
    dynamicTicks.push(i)
  }

  return (
    <div className="bg-white rounded-[14px] border border-black/5 p-4 mb-4">
      <style>{`
        .pill { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--s2); color: var(--tx2); border: none; transition: 0.2s; }
        .active-pill { background: var(--tx); color: white; }
      `}</style>

      {viewMode === 'Billing Cycle' && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setBillingSubMode('day')} className={`pill ${billingSubMode === 'day' ? 'active-pill' : ''}`}>Day-wise</button>
          <button onClick={() => setBillingSubMode('week')} className={`pill ${billingSubMode === 'week' ? 'active-pill' : ''}`}>Week-wise</button>
        </div>
      )}

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-mid border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={graphData} margin={{ top: 20, right: 8, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4DE" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#A8A59E' }} axisLine={false} tickLine={false}>
              <Label value={viewMode === 'Daily' ? 'TIME' : viewMode === 'Yearly' ? 'MONTH' : 'DATE'} offset={-5} position="insideBottom" style={{ fontSize: 10, fill: '#A8A59E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </XAxis>
            <YAxis 
              tick={{ fontSize: 10, fill: '#A8A59E' }} 
              axisLine={false} 
              tickLine={false} 
              width={40}
              ticks={viewMode === 'Daily' ? dynamicTicks : undefined}
              domain={viewMode === 'Daily' ? [0, Math.max(...dynamicTicks)] : [0, 'auto']}
            >
              <Label value="kWh" angle={-90} position="insideLeft" style={{ fontSize: 10, fill: '#A8A59E', fontWeight: 600, textAnchor: 'middle', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            
            <Bar dataKey="kwh" radius={[3, 3, 0, 0]} barSize={18}>
              {graphData.map((entry, i) => (
                <Cell 
                  key={i} 
                  fill={entry.kwh === 0 ? '#E8E4DE' : '#D4880A'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
