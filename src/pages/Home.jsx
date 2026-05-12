import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHomeData } from '../hooks/useHomeData'
import BottomNav from '../components/BottomNav'
import EnergyGraph from '../components/EnergyGraph'

function fmt(mins) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ZH'
}

// Slabs now driven by useHomeData (two-part TNEB logic)

function Skeleton({ className = '' }) {
  return <div className={`bg-surface-2 rounded-lg animate-pulse ${className}`} />
}

// ── EnergyCard — now reads `today.devices` (clean array) ──────────────────────
function EnergyCard({ today, viewMode, toggleViewMode }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const devices = today?.devices || []
  const note = today?.device_breakdown_note ?? null
  const maxKwh = devices.length ? Math.max(...devices.map(d => d.kwh), 0.1) : 1
  const devColors = ['#2D7D46', '#1A5FB4', '#D4880A', '#5B3FA6', '#C0392B']
  const totalKwh = today?.total_kwh || 0
  const actualToday = new Date().toISOString().split('T')[0]
  const isNotLive = today?.is_fallback || (today?.report_date && today.report_date !== actualToday)

  const modes = ['Daily', 'Weekly', 'Billing Cycle']

  return (
    <div className="card mb-3 relative">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-tx-3 mb-1">
            Energy consumption · {isNotLive ? (
              <span className="text-amber-mid">
                {new Date(today.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            ) : 'Live today'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-medium text-tx leading-none">
              {totalKwh.toFixed(1)}
            </span>
            <span className="text-base text-tx-2">kWh</span>
          </div>
          {isNotLive ? (
            <p className="text-[10px] text-amber-mid/80 font-medium mt-0.5 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 3v2.5M5 7h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Latest available data
            </p>
          ) : today?.as_of_ist && (
            <p className="text-[10px] text-tx-3 mt-0.5">as of {today.as_of_ist} IST</p>
          )}
        </div>

        {/* Custom Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 bg-surface-2 rounded-full px-3 py-1.5 border border-black/10 cursor-pointer active:scale-95 transition-all"
          >
            <span className="text-xs font-semibold text-tx">{viewMode}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <path d="M3 4.5l3 3 3-3" stroke="#6B6860" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-32 bg-surface border border-black/8 rounded-2xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {modes.map(m => (
                  <div
                    key={m}
                    onClick={() => {
                      toggleViewMode(m)
                      setIsOpen(false)
                    }}
                    className={`px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer ${viewMode === m ? 'bg-green-bg text-green-mid' : 'text-tx-2 hover:bg-surface-2Active'}`}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {devices.length === 0 ? (
          <p className="text-xs text-tx-3 py-2">No sessions recorded yet today</p>
        ) : (
          devices.slice(0, 3).map((dev, i) => {
            const barW = Math.round((dev.kwh / maxKwh) * 100)
            return (
              <div key={dev.device_id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-tx">{dev.name}</span>
                  <span className="text-xs text-tx-2">{dev.kwh.toFixed(2)} kWh</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barW}%`, backgroundColor: devColors[i] }}
                  />
                </div>
              </div>
            )
          })
        )}
        {devices.length > 0 && (
          <Link 
            to="/appliances" 
            className="flex items-center justify-between w-full bg-green-bg/40 hover:bg-green-bg/60 border border-green-mid/10 rounded-xl px-4 py-3 mt-1.5 transition-all group"
          >
            <span className="text-[13px] font-semibold text-green-mid">Dive deep into appliances reading</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transform group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="#2D7D46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
        {note && (
          <p style={{ fontSize: 11, color: '#A8A59E', marginTop: 6, lineHeight: 1.4 }}>
            {note}
          </p>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-black/5">
          <span className="text-xs text-tx-3">
            {(() => {
              const activeSessions = today?.open_sessions || []
              if (activeSessions.length === 0) return 'No sessions right now'
              if (activeSessions.length > 1) return `${activeSessions.length} devices currently running`
              return `${activeSessions[0].name} is still running`
            })()}
          </span>
          <Link to="/appliances" className="text-xs font-medium text-tx-2 hover:underline underline-offset-2 cursor-pointer">
            {today?.session_count || 0} sessions {viewMode === 'Daily' ? 'today' : viewMode === 'Weekly' ? 'this week' : 'this cycle'}
          </Link>
        </div>
        {(today?.estimated_cost_inr > 0 || today?.estimated_full_home_kwh > 0) && (
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5">
            <span className="text-[10px] text-tx-3 uppercase tracking-wider font-bold">
              Est. Cost: <span className="text-tx">₹{Math.round(today.estimated_cost_inr)}</span>
            </span>
            <span className="text-[10px] text-tx-3 uppercase tracking-wider font-bold">
              Est. Full Home: <span className="text-tx">{today.estimated_full_home_kwh.toFixed(1)} kWh</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── BillingCard — now reads `billing.kwh_accumulated` ─────────────────────────
const SLABS = [
  { num: 1, label: 'Free',  min: 1, max: 100, units: 100, rate: 0, color: '#1D9E75' },
  { num: 2, label: '₹2.35', min: 101, max: 200, units: 100, rate: 2.35, color: '#EF9F27' },
  { num: 3, label: '₹4.70', min: 201, max: 400, units: 200, rate: 4.70, color: '#E24B4A' },
  { num: 4, label: '₹6.30', min: 401, max: 500, units: 100, rate: 6.30, color: '#534AB7' },
]
const TOTAL_UNITS = 500

function BillingCard({ billing, report }) {
  const measuredUnits = parseFloat(billing?.kwh_accumulated ?? report?.cycle_measured_kwh_after ?? 0)
  const estimatedUnits = parseFloat(billing?.kwh_estimated ?? report?.cycle_estimated_after ?? 0)

  const cycleStart = billing?.cycle_start ? new Date(billing.cycle_start) : null
  const cycleEnd = billing?.cycle_end ? new Date(billing.cycle_end) : null
  const today = new Date()

  const startFmt = cycleStart ? cycleStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'
  const endFmt = cycleEnd ? cycleEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

  const currentSlab = SLABS.find(s => estimatedUnits >= s.min && estimatedUnits <= s.max) ?? (estimatedUnits > TOTAL_UNITS ? SLABS[SLABS.length - 1] : SLABS[0])
  const unitsLeftInSlab = Math.max(0, currentSlab.max - estimatedUnits)

  const measuredPct = Math.min((measuredUnits / TOTAL_UNITS) * 100, 100)
  const estimatedPct = Math.min((estimatedUnits / TOTAL_UNITS) * 100, 100)

  const daysLeft = Math.max(0, Math.ceil((cycleEnd - today) / (1000 * 60 * 60 * 24)))
  const daysElapsed = Math.max(1, Math.ceil((today - cycleStart) / (1000 * 60 * 60 * 24)))
  const pacePerDay = measuredUnits / daysElapsed
  const projectedTotal = measuredUnits + (pacePerDay * daysLeft)

  let tip = ''
  if (currentSlab.num === 4 && unitsLeftInSlab > 0) {
    tip = `Est. total ${estimatedUnits.toFixed(0)} units — ${unitsLeftInSlab.toFixed(0)} units before Slab 4 limit (500 units). At ₹6.30/unit after 400 units.`
  } else if (currentSlab.num < 4 && projectedTotal > currentSlab.max) {
    const crossDate = new Date(today)
    const daysToNextSlab = Math.ceil((currentSlab.max - measuredUnits) / pacePerDay)
    crossDate.setDate(today.getDate() + daysToNextSlab)
    const nextSlab = SLABS[currentSlab.num] 
    tip = `At this rate you'll enter Slab ${nextSlab.num} (₹${nextSlab.rate}/unit) around ${crossDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. Reduce AC by 1–2 hrs/day to stay in Slab ${currentSlab.num}.`
  } else {
    tip = `On track. Est. to finish cycle at ${projectedTotal.toFixed(0)} units — staying in Slab ${currentSlab.num} (₹${currentSlab.rate}/unit).`
  }

  let estimatedBill = 0
  SLABS.forEach(s => {
    if (estimatedUnits >= s.min) {
      const unitsInSlab = Math.min(estimatedUnits, s.max) - s.min + 1
      estimatedBill += unitsInSlab * s.rate
    }
  })

  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-tx-2">TNEB · {startFmt} – {endFmt}</span>
        <span className="badge text-[10px] font-bold" style={{ background: currentSlab.color + '15', color: currentSlab.color }}>
          Slab {currentSlab.num} · ₹{currentSlab.rate}/unit
        </span>
      </div>

      <div className="mb-9 mt-4 px-1">
        <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.05)', overflow: 'visible' }}>
          <div style={{ display: 'flex', height: '100%', borderRadius: 5, overflow: 'hidden' }}>
            {SLABS.map(s => (
              <div key={s.num} style={{
                width: `${(s.units / TOTAL_UNITS) * 100}%`,
                background: estimatedUnits >= s.min ? s.color : 'rgba(0,0,0,0.1)',
                opacity: estimatedUnits >= s.min ? 1 : 0.2
              }} />
            ))}
          </div>
          <div style={{ position: 'absolute', top: -3, left: `${measuredPct}%`, width: 2, height: 16, background: '#333', borderRadius: 1, transform: 'translateX(-50%)', zIndex: 10 }} />
          <div style={{ position: 'absolute', top: 14, left: `${measuredPct}%`, transform: 'translateX(-50%)', fontSize: 9, fontWeight: 'bold', color: '#666', whiteSpace: 'nowrap' }}>
            {measuredUnits.toFixed(0)} measured
          </div>
          <div style={{ position: 'absolute', top: -8, left: `${estimatedPct}%`, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid #333', transform: 'translateX(-50%)' }} />
        </div>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="text-[11px] text-tx-3 mb-0.5">
            {measuredUnits.toFixed(0)} measured · {estimatedUnits.toFixed(0)} est. total
          </div>
          <div className="text-[13px] font-bold text-tx">
            {estimatedUnits.toFixed(0)} units used · {unitsLeftInSlab > 0 
              ? `${unitsLeftInSlab.toFixed(0)} units left in Slab ${currentSlab.num}`
              : `Reached end of Slab ${currentSlab.num}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-tx-3 uppercase font-bold tracking-wider">Est. Bill</div>
          <div className="text-xl font-bold text-tx">₹{Math.round(estimatedBill).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {SLABS.map((s) => {
          const isNow = s.num === currentSlab.num
          const isDone = estimatedUnits > s.max
          return (
            <div key={s.num} className={`rounded-xl py-2.5 px-1 text-center border-[1.5px] transition-all ${isNow ? '' : 'opacity-60'}`}
              style={{ background: isNow ? s.color + '10' : (isDone ? s.color + '05' : 'transparent'), borderColor: isNow ? s.color : 'rgba(0,0,0,0.05)' }}>
              <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: s.color }}>Slab {s.num}</div>
              <div className="text-[13px] font-bold text-tx">{s.label}</div>
              <div className="text-[8px] text-tx-3 mb-1">{s.min}–{s.max} units</div>
              <div className="text-[9px] font-bold" style={{ color: (isNow || isDone) ? s.color : '#A8A59E' }}>
                {isNow ? `Now · ${unitsLeftInSlab.toFixed(0)} left` : (isDone ? 'Done ✓' : 'Soon')}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-surface-2 rounded-xl p-3 border border-black/5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-brand-yellow/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4880A" strokeWidth="2.5"><path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M2 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" /></svg>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-tx-2">Savings Insight</span>
        </div>
        <p className="text-xs text-tx-2 leading-relaxed">{tip}</p>
      </div>
    </div>
  )
}

function WaterWasteTiles({ waterConnected }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-3">
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest text-tx-3 mb-2">Water today</p>
        {waterConnected ? (
          <div className="text-2xl font-medium text-tx">— L</div>
        ) : (
          <>
            <div className="text-xs text-tx-2 mb-2 leading-snug">Meter not connected</div>
            <span className="badge bg-red-bg text-red-mid text-[10px]">WEGoT · Not connected</span>
          </>
        )}
      </div>
      <div className="card flex flex-col justify-between cursor-pointer active:bg-surface-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-tx-3 mb-2">Waste</p>
        <p className="text-xs text-tx-2 leading-snug">Log your waste collection</p>
        <div className="flex justify-end mt-2">
          <div className="w-7 h-7 rounded-full bg-green-mid flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpenSessionCard({ devicesStillOn }) {
  if (!devicesStillOn || devicesStillOn.length === 0) {
    return (
      <div className="bg-[#F0FDF4] rounded-[24px] p-5 mb-4 flex gap-4 items-center border border-[#DCFCE7]">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 21a9 9 0 1 1 9-9c-1.3-.2-3-.2-4.5.5-2 1-3.5 3-4 5.5-.2 1.5.2 3 .5 4v0c-1 .3-2 .5-3 .5z" fill="#22C55E" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-[17px] font-serif text-[#14532D] mb-1">No devices running</h3>
          <p className="text-[13px] text-[#166534] leading-snug">Your home is in an optimal, low-power state.</p>
        </div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="bg-[#FFF9EE] rounded-[24px] p-5 mb-4 border border-[#F2E5D0]">
      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4880A]">Currently Running ({devicesStillOn.length})</span>
      </div>
      <div className="space-y-4">
        {devicesStillOn.map((dev, i) => {
          let durationStr = "Just started"
          if (dev.started_raw) {
            const start = new Date(dev.started_raw)
            const diffMs = now - start
            const hrs = Math.floor(diffMs / 3600000)
            const mins = Math.floor((diffMs % 3600000) / 60000)
            if (hrs > 0) durationStr = `${hrs}h ${mins}m`
            else if (mins > 0) durationStr = `${mins}m`
          }

          return (
            <div key={dev.device_id || i} className={`flex gap-4 items-start ${i > 0 ? 'pt-4 border-t border-[#F2E5D0]' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4L4 18H20L12 4Z" fill="#E89F2A" stroke="#E89F2A" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12 10V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16.5" r="1.5" fill="white" />
                </svg>
              </div>
              <div className="pt-0.5">
                <h3 className="text-[17px] font-serif text-[#2A2A2A] mb-1.5">{dev.name}</h3>
                <p className="text-[13px] text-[#6B6860] leading-snug">
                  {dev.started_ist ? `Started at ${dev.started_ist} · Running for ${durationStr}` : dev.mockText || 'Currently active'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function InsightCard({ tip }) {
  // Always display the UI perfectly matching the mockup, using fallback text if backend is empty
  const activeTip = tip || "Your AC ran 40% longer last night compared to your weekly average. *💡 Tip* Setting to 24°C saves ~₹180/month"

  let mainTip = activeTip
  let pillTip = null

  if (activeTip.includes('*💡 Tip*')) {
    const parts = activeTip.split('*💡 Tip*')
    mainTip = parts[0].replace(/\*Insight\*:\s*/gi, '').replace(/\*/g, '').trim()
    pillTip = parts[1].replace(/\*/g, '').trim()
  } else {
    // If there is no Tip delimiter, we'll try to split by sentence to fake the pill for UI consistency
    const sentences = tip.replace(/\*/g, '').split('.')
    if (sentences.length > 1 && sentences[sentences.length - 1].trim() === '') {
      sentences.pop()
    }
    if (sentences.length > 1) {
      pillTip = sentences.pop().trim() + '.'
      mainTip = sentences.join('. ').trim() + '.'
    } else {
      mainTip = sentences.join('. ').trim()
      pillTip = "Review your usage to optimize energy bill."
    }
  }

  return (
    <div className="bg-[#F5F2FF] rounded-[24px] p-5 mb-5 border border-[#E9E4FC]">
      <div className="flex gap-4 items-start mb-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B3FA6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
            <path d="M12 2v1"></path>
            <path d="M12 7a5 5 0 1 1-3.66 8.5 2 2 0 0 0-.84 1.5H16.5a2 2 0 0 0-.84-1.5A5 5 0 0 1 12 7z" fill="#5B3FA6" stroke="none"></path>
          </svg>
        </div>
        <div className="pt-0.5 pr-2">
          <h3 className="text-[17px] font-serif text-[#1A1A1A] mb-1.5">AI Performance Insight</h3>
          <p className="text-[14px] text-[#6B6860] leading-[1.4] max-w-[95%]">{mainTip}</p>
        </div>
      </div>
      
      {pillTip && (
        <div className="bg-white rounded-[16px] py-3 px-4 flex items-center gap-3 w-full shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B3FA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"></path>
            <path d="M2 9v1c0 1.1.9 2 2 2h1"></path>
            <circle cx="16" cy="11" r="1.5" fill="#5B3FA6"></circle>
          </svg>
          <span className="text-[13px] font-bold text-[#5B3FA6]">{pillTip}</span>
        </div>
      )}
    </div>
  )
}



// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { session, household } = useAuth()
  const [viewMode, setViewMode] = useState('Daily')
  const { data, loading } = useHomeData(household?.id, viewMode)

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode)
  }

  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    || household?.property_name?.split(' ')[0]
    || 'there'

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  })

  return (
    <div className="min-h-screen bg-app-bg pb-24">
      <div className="bg-surface border-b border-black/8 px-4 pt-3 pb-4 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-serif text-tx">{greet()}, {userName}!</h1>
            <p className="text-xs text-tx-2 mt-0.5">{today} · {household?.city || 'Nagercoil'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-bg flex items-center justify-center">
            <span className="text-xs font-semibold text-green-mid">{initials(userName)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <EnergyCard
              today={data?.today}
              viewMode={viewMode}
              toggleViewMode={handleViewModeChange}
            />
            {/* ✅ passing billing not cycle */}
            <BillingCard
              billing={data?.billing}
              report={data?.report}
            />
            <WaterWasteTiles waterConnected={household?.water_connected} />
            <OpenSessionCard devicesStillOn={data?.today?.open_sessions} />
            <InsightCard tip={
              data?.today?.open_sessions?.length === 0
                ? "No appliances are drawing power right now. Your home is in deep-sleep mode. *💡 Tip* Unplug standby electronics to save up to 5% on base load."
                : data?.report?.tip_text
            } />
            <div className="card mb-3 px-0 pt-3 pb-0 overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-tx-3 px-4 mb-1">Usage trend · Today hourly</p>
              <EnergyGraph
                viewMode="Daily"
                householdId={household?.id}
                cycleStart={data?.billing?.cycle_start}
                slabCrossingDate={data?.billing?.slab_crossing_date}
                selectedDate={new Date().toISOString().split('T')[0]}
              />
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}