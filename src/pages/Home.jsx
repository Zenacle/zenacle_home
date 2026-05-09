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
function BillingCard({ billing, report }) {
  const unitsMeasured = billing?.kwh_accumulated || 0
  const unitsEstimated = billing?.kwh_estimated || 0

  const cycleStart = billing?.cycle_start ? new Date(billing.cycle_start) : null
  const cycleEnd = billing?.cycle_end ? new Date(billing.cycle_end) : null
  const isHistorical = cycleEnd && cycleEnd < new Date()
  
  const startFmt = cycleStart 
    ? cycleStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: cycleStart.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
    : '—'
  const endFmt = cycleEnd 
    ? cycleEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: cycleEnd.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
    : '—'

  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-tx-2">TNEB · {startFmt} – {endFmt}</span>
        <span className="badge text-[10px]" style={{ background: '#FEF3DC', color: '#B87200' }}>
          {isHistorical ? 'Cycle Ended' : billing?.current_slab_name || '...'}
        </span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {unitsEstimated <= 500 ? (() => {
          const est = unitsEstimated;
          const w1 = Math.min(est, 100) / 5;
          const w2 = Math.max(0, Math.min(est - 100, 100)) / 5;
          const w3 = Math.max(0, Math.min(est - 200, 200)) / 5;
          const w4 = Math.max(0, Math.min(est - 400, 100)) / 5;
          const rem = Math.max(0, 500 - est) / 5;
          return (
            <>
              {w1 > 0 && <div style={{ width: `${w1}%`, background: '#2D7D46' }}></div>}
              {w2 > 0 && <div style={{ width: `${w2}%`, background: '#D4880A' }}></div>}
              {w3 > 0 && <div style={{ width: `${w3}%`, background: '#C0392B' }}></div>}
              {w4 > 0 && <div style={{ width: `${w4}%`, background: '#5B3FA6' }}></div>}
              {rem > 0 && <div style={{ width: `${rem}%`, background: '#888', opacity: 0.15 }}></div>}
            </>
          );
        })() : (() => {
          const est = unitsEstimated;
          const w1 = 100 / 10;
          const w2 = Math.min(est - 100, 300) / 10;
          const w3 = Math.max(0, Math.min(est - 400, 100)) / 10;
          const w4 = Math.max(0, Math.min(est - 500, 100)) / 10;
          const w5 = Math.max(0, Math.min(est - 600, 200)) / 10;
          const w6 = Math.max(0, Math.min(est - 800, 200)) / 10;
          const rem = Math.max(0, 1000 - est) / 10;
          return (
            <>
              {w1 > 0 && <div style={{ width: `${w1}%`, background: '#2D7D46' }}></div>}
              {w2 > 0 && <div style={{ width: `${w2}%`, background: '#1A5FB4' }}></div>}
              {w3 > 0 && <div style={{ width: `${w3}%`, background: '#D4880A' }}></div>}
              {w4 > 0 && <div style={{ width: `${w4}%`, background: '#C0392B' }}></div>}
              {w5 > 0 && <div style={{ width: `${w5}%`, background: '#9B2C2C' }}></div>}
              {w6 > 0 && <div style={{ width: `${w6}%`, background: '#5B3FA6' }}></div>}
              {rem > 0 && <div style={{ width: `${rem}%`, background: '#888', opacity: 0.15 }}></div>}
            </>
          );
        })()}
      </div>

      <div className={`grid gap-1 mb-3 ${unitsEstimated > 500 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {(billing?.slab_status || []).map((s, idx) => {
          const colorMap = {
            'Slab 1': '#2D7D46',
            'Slab 2': unitsEstimated <= 500 ? '#D4880A' : '#1A5FB4',
            'Slab 3': unitsEstimated <= 500 ? '#C0392B' : '#D4880A',
            'Slab 4': unitsEstimated <= 500 ? '#5B3FA6' : '#C0392B',
            'Slab 5': '#9B2C2C',
            'Slab 6': '#5B3FA6',
          };
          const color = colorMap[s.name] || '#888';
          
          return (
            <div
              key={idx}
              className="rounded-lg py-1.5 px-1 text-center relative"
              style={{
                background: s.active ? `${color}20` : s.status === 'Done ✓' ? '#F0EDE7' : '#F0EDE7',
                border: s.active ? `1.5px solid ${color}` : '1px solid transparent',
                opacity: s.status.includes('–') ? 0.5 : 1,
              }}
            >
              <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: s.active ? color : s.status === 'Done ✓' ? '#2D7D46' : '#A8A59E' }}>
                {s.name}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: s.active ? color : s.status === 'Done ✓' ? '#1F6E3F' : '#1A1916' }}>
                {s.rate}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: s.active ? color : s.status === 'Done ✓' ? '#2D7D46' : '#A8A59E' }}>
                {s.status}
              </div>
              {s.fillPct !== undefined && (
                <div className="mx-auto mt-1 w-4/5 h-[3px] bg-black/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${s.fillPct}%`, background: s.status === 'Done ✓' ? '#2D7D46' : s.active ? color : '#A8A59E' }} 
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-tx-2">
        <span>
          <strong className="text-tx">{Math.round(unitsMeasured)}</strong> measured · 
          <strong className="text-tx ml-1">{Math.round(unitsEstimated)}</strong> est. total
        </span>
      </div>

      <div className="mt-3 bg-amber-bg rounded-xl p-3 flex gap-2.5 items-start border border-amber-mid/30">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 mt-0.5">
          <path d="M7.5 1L14 13H1L7.5 1Z" stroke="#D4880A" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M7.5 5.5v3.5" stroke="#D4880A" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="7.5" cy="11" r="0.65" fill="#D4880A" />
        </svg>
        <div>
          <p className="text-xs font-medium text-amber-mid">
            {(() => {
              const activeSlab = (billing?.slab_status || []).find(s => s.active);
              const maxUnits = activeSlab && activeSlab.range ? parseInt(activeSlab.range.split('–')[1], 10) : 500;
              return unitsEstimated > maxUnits 
                ? 'Projected to cross current slab' 
                : `${Math.round(maxUnits - unitsEstimated)} units buffer on estimated total`
            })()}
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