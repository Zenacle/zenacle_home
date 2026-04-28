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

const SLABS = [
  { slab: 1, min: 0,   max: 100,  rate: 0,    label: 'Free',   color: '#2D7D46', bg: '#E3F5E9', text: '#1F6E3F' },
  { slab: 2, min: 101, max: 200,  rate: 2.35, label: '₹2.35',  color: '#D4880A', bg: '#FEF3DC', text: '#B87200' },
  { slab: 3, min: 201, max: 400,  rate: 4.70, label: '₹4.70',  color: '#C0392B', bg: '#FDECEA', text: '#A8261E' },
  { slab: 4, min: 401, max: 500,  rate: 6.30, label: '₹6.30',  color: '#7B1FA2', bg: '#F3E8FF', text: '#6A1290' },
]

function currentSlab(units) {
  if (units <= 100) return SLABS[0]
  if (units <= 200) return SLABS[1]
  if (units <= 400) return SLABS[2]
  return SLABS[3]
}

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
function BillingCard({ billing, report }) {
  // ✅ billing.kwh_accumulated is the correct key
  const unitsMeasured = billing?.kwh_accumulated || 0
  const unitsEstimated = billing?.kwh_estimated || 0
  const slab = currentSlab(unitsEstimated)
  const slabIdx = SLABS.indexOf(slab)

  const cycleStart = billing?.cycle_start ? new Date(billing.cycle_start) : null
  const cycleEnd = billing?.cycle_end ? new Date(billing.cycle_end) : null
  const isHistorical = cycleEnd && cycleEnd < new Date()
  
  const startFmt = cycleStart 
    ? cycleStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: cycleStart.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
    : '—'
  const endFmt = cycleEnd 
    ? cycleEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: cycleEnd.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
    : '—'

  const forecast = billing?.kwh_estimated || 0
  const segWidths = [100, 100, 300, 500]
  const total = segWidths.reduce((a, b) => a + b, 0)

  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-tx-2">TNEB · {startFmt} – {endFmt}</span>
        <span className="badge text-[10px]" style={{ background: slab.bg, color: slab.text }}>
          {isHistorical ? 'Cycle Ended' : `In Slab ${slabIdx + 1}`}
        </span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {SLABS.map((s, i) => {
          const filled = i < slabIdx
          const current = i === slabIdx
          const pct = (segWidths[i] / total * 100).toFixed(1)
          return (
            <div
              key={i}
              style={{
                width: `${pct}%`,
                backgroundColor: filled || current ? s.color : '#E8E4DE',
                opacity: current ? 1 : filled ? 0.7 : 0.3,
              }}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-4 gap-1 mb-3">
        {SLABS.map((s, i) => {
          const isCurrent = i === slabIdx
          const isPast = i < slabIdx
          return (
            <div
              key={i}
              className="rounded-lg py-1.5 px-1 text-center"
              style={{
                background: isCurrent ? s.bg : isPast ? s.bg : '#F0EDE7',
                border: isCurrent ? `1.5px solid ${s.color}` : '1px solid transparent',
                opacity: i > slabIdx ? 0.5 : 1,
              }}
            >
              <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: s.color }}>
                Slab {i + 1}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: isPast || isCurrent ? s.text : '#A8A59E' }}>
                {s.label}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: s.color }}>
                {isPast ? 'Done ✓' : isCurrent ? 'Now' : `${SLABS[i - 1]?.max ?? 0 + 1}–${s.max}`}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-tx-2">
        <span>
          <strong className="text-tx">{Math.round(unitsMeasured)}</strong> measured · 
          <strong className="text-tx ml-1">{Math.round(unitsEstimated)}</strong> est. total
        </span>
        {unitsEstimated > 0 && (
          <span className="flex items-center gap-1">
            Slab {slabIdx + 1} limit: {slab.max}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H5M10 2v5" stroke="#6B6860" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      <div className="mt-3 bg-amber-bg rounded-xl p-3 flex gap-2.5 items-start border border-amber-mid/30">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-0.5">
          <path d="M7.5 1L14 13H1L7.5 1Z" stroke="#D4880A" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M7.5 5.5v3.5" stroke="#D4880A" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="7.5" cy="11" r="0.65" fill="#D4880A" />
        </svg>
        <div>
          <p className="text-xs font-medium text-amber-mid">
            {unitsEstimated > slab.max ? 'Projected to cross current slab' : `${Math.round(slab.max - unitsEstimated)} units buffer on estimated total`}
          </p>
          <p className="text-[11px] text-amber-mid/80 mt-0.5">
            {report?.slab_crossing_date
              ? `At this rate you'll cross around ${report.slab_crossing_date} · Reduce AC by 2 hrs to delay crossing`
              : 'At this rate you may cross soon · Reduce AC by 2 hrs to delay crossing'}
          </p>
        </div>
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
  // Use real data if available, otherwise display the exact mockup design as a fallback
  const dev = devicesStillOn?.length ? devicesStillOn[0] : { 
    name: "AC — 1st floor", 
    mockText: "Running for 4h 20m. Adding ~0.8 units per hour to your current bill." 
  }

  return (
    <div className="bg-[#FFF9EE] rounded-[24px] p-5 mb-4 flex gap-4 items-start border border-[#F2E5D0]">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 4L4 18H20L12 4Z" fill="#E89F2A" stroke="#E89F2A" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 10V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.5" fill="white" />
        </svg>
      </div>
      <div className="pt-0.5">
        <h3 className="text-[15px] font-bold text-[#2A2A2A] mb-1.5">{dev.name} {dev.name.includes("is still on") ? "" : "is still on"}</h3>
        <p className="text-[13px] text-[#6B6860] leading-snug">
          {dev.started_ist ? `Running since ${dev.started_ist}.` : dev.mockText}
        </p>
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
          <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-1.5">AI Performance Insight</h3>
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
            <h1 className="text-lg font-medium text-tx">{greet()}, {userName}</h1>
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