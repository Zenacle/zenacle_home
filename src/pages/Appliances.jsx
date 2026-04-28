import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHomeData } from '../hooks/useHomeData'
import BottomNav from '../components/BottomNav'

const DEVICES = [
  {
    id:'ea0b',name:'AC — 1st Floor',type:'ac',floor:'1st Floor',room:'Bedroom',
    brand:'LG',model:'—',status:'connected',controllable:true,
    totalKwh:58.29,totalSessions:38,totalMins:5566,avgWatts:777,
    todayKwh:10.09,todayMins:850,todaySessions:3,
    lastSeen:'Apr 19, 9:56 PM',
    color:'var(--Am)',bg:'var(--Abg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:7.80,mins:543},{day:'15',kwh:12.79,mins:1470},
      {day:'16',kwh:8.06,mins:795},{day:'17',kwh:7.11,mins:760},
      {day:'18',kwh:12.43,mins:1148},{day:'19',kwh:10.09,mins:850},
    ],
    sessions:[
      {start:'Apr 19, 9:56 PM',end:'Apr 20, 7:11 AM',dur:'9h 15m',kwh:5.66,quality:'estimated'},
      {start:'Apr 19, 7:26 PM',end:'Apr 19, 9:41 PM',dur:'2h 15m',kwh:2.23,quality:'complete'},
      {start:'Apr 19, 2:26 PM',end:'Apr 19, 5:06 PM',dur:'2h 40m',kwh:2.20,quality:'complete'},
    ]
  },
  {
    id:'3b89',name:'AC — Ground Floor',type:'ac',floor:'Ground Floor',room:'Living Room',
    brand:'Samsung',model:'—',status:'connected',controllable:true,
    totalKwh:33.64,totalSessions:18,totalMins:3890,avgWatts:701,
    todayKwh:7.71,todayMins:780,todaySessions:4,
    lastSeen:'Apr 19, 8:31 PM',
    color:'var(--Bl)',bg:'var(--Blbg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:4.46,mins:315},{day:'15',kwh:5.76,mins:920},
      {day:'16',kwh:4.72,mins:615},{day:'17',kwh:5.40,mins:705},
      {day:'18',kwh:5.59,mins:555},{day:'19',kwh:7.71,mins:780},
    ],
    sessions:[
      {start:'Apr 19, 8:31 PM',end:'Apr 20, 5:11 AM',dur:'8h 40m',kwh:3.68,quality:'estimated'},
      {start:'Apr 19, 12:56 PM',end:'Apr 19, 3:36 PM',dur:'2h 40m',kwh:2.51,quality:'complete'},
    ]
  },
  {
    id:'ff32',name:'Water Pump',type:'pump',floor:'Ground Floor',room:'Utility',
    brand:'Haier',model:'—',status:'connected',controllable:true,
    totalKwh:1.33,totalSessions:8,totalMins:181,avgWatts:560,
    todayKwh:0.42,todayMins:55,todaySessions:2,
    lastSeen:'Apr 19, 8:21 AM',
    color:'var(--Gm)',bg:'var(--Gbg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:0.06,mins:11},{day:'15',kwh:0.23,mins:35},
      {day:'16',kwh:0.10,mins:15},{day:'17',kwh:0.24,mins:30},
      {day:'18',kwh:0.29,mins:35},{day:'19',kwh:0.42,mins:55},
    ],
    sessions:[
      {start:'Apr 19, 8:01 AM',end:'Apr 19, 8:31 AM',dur:'30m',kwh:0.28,quality:'complete'},
      {start:'Apr 19, 6:11 AM',end:'Apr 19, 6:36 AM',dur:'25m',kwh:0.14,quality:'complete'},
    ]
  },
  {
    id:'2ec9',name:'Heater — 1st Floor',type:'geyser',floor:'1st Floor',room:'Bedroom',
    brand:'Orient',model:'LS-Q18YNZA',status:'connected',controllable:true,
    totalKwh:0,totalSessions:0,totalMins:0,avgWatts:null,
    todayKwh:0,todayMins:0,todaySessions:0,
    lastSeen:'Never',
    color:'var(--Rm)',bg:'var(--Rbg)',dotColor:'#F59E0B',
    weekData:[],sessions:[],noData:true
  },
  {
    id:'a281',name:'Heater — Ground Floor',type:'geyser',floor:'Ground Floor',room:'Bedroom',
    brand:'Orient',model:'—',status:'connected',controllable:true,
    totalKwh:0,totalSessions:0,totalMins:0,avgWatts:null,
    todayKwh:0,todayMins:0,todaySessions:0,
    lastSeen:'Never',
    color:'var(--Rm)',bg:'var(--Rbg)',dotColor:'#F59E0B',
    weekData:[],sessions:[],noData:true
  }
];

const TYPE_ICONS = {
  ac: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5.5" width="16" height="9" rx="2.5" stroke={c} strokeWidth="1.5"/>
      <path d="M5 5.5V4.5a1 1 0 011-1h8a1 1 0 011 1v1" stroke={c} strokeWidth="1.5"/>
      <path d="M6.5 11h7" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6.5 14.5v2.5M13.5 14.5v2.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  pump: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5C10 2.5 5 8.5 5 13a5 5 0 0010 0c0-4.5-5-10.5-5-10.5Z" stroke={c} strokeWidth="1.5"/>
      <path d="M8 13.5c0-1.1.9-2 2-2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  geyser: (c) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="6" y="2" width="8" height="14" rx="3" stroke={c} strokeWidth="1.5"/>
      <path d="M10 8v4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 16h8" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
};

const ICO_BGS = ['var(--Abg)', 'var(--Blbg)', 'var(--Gbg)']

function fmt(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

export default function Appliances() {
  const { household } = useAuth()
  const { data, loading } = useHomeData(household?.id, 'Weekly')
  
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  // Calculate "Current Week" (Monday start) totals from chartData
  const weekStats = useMemo(() => {
    if (!data?.chartData) return { kwh: 0, sessions: 0, runtime: 0 }
    
    const now = new Date()
    // Monday of current week
    const day = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = (day === 0 ? -6 : 1) - day 
    const monday = new Date()
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)

    const weekRows = data.chartData.filter(r => new Date(r.report_date) >= monday)
    
    let totalKwh = weekRows.reduce((s, r) => s + parseFloat(r.total_kwh || 0), 0)
    let totalSessions = weekRows.reduce((s, r) => s + parseInt(r.total_sessions || 0, 10), 0)
    
    let totalRuntime = 0
    weekRows.forEach(r => {
      let bd = {}
      try { 
        bd = typeof r.device_type_breakdown === 'string' 
          ? JSON.parse(r.device_type_breakdown) 
          : (r.device_type_breakdown || {}) 
      } catch(e) {}
      
      const devs = bd.today || bd.by_device || bd.by_type || {}
      Object.values(devs).forEach(d => totalRuntime += parseInt(d.minutes || 0, 10))
      
      if (Array.isArray(bd.carried_over)) {
        bd.carried_over.forEach(d => totalRuntime += parseInt(d.minutes || 0, 10))
      }
    })

    if (data.today) {
      totalKwh += parseFloat(data.today.live_kwh || 0)
      totalSessions += parseInt(data.today.live_sessions || 0, 10)
      totalRuntime += parseInt(data.today.live_runtime || 0, 10)
    }

    return { kwh: totalKwh, sessions: totalSessions, runtime: totalRuntime }
  }, [data])

  const filteredDevices = DEVICES.filter(d => {
    if (filter === 'all') return true
    if (filter === 'connected') return d.status === 'connected'
    if (filter === 'active') return d.todayKwh > 0
    if (filter === 'no-data') return d.noData
    return true
  })

  const activeDevs = filteredDevices.filter(d => !d.noData)
  const noDataDevs = filteredDevices.filter(d => d.noData)

  // Real-time stats calculation
  const devicesWithDataCount = data?.today?.devices ? data.today.devices.filter(d => d.kwh > 0).length : 0
  const totalCount = DEVICES.length

  // Merge real data into device display
  const getDynamicStats = (device) => {
    if (!data?.today?.devices) return { kwh: 0, mins: 0, lastSeen: device.lastSeen, dotColor: '#A8A59E', lastActiveLabel: 'No sessions yet', kwhDisplay: '0.000', kwhLabel: 'kWh' }
    
    const normalize = (n) => n?.toLowerCase().replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim()
    const targetName = normalize(device.name)
    const match = data.today.devices.find(rd => {
      const dbName = normalize(rd.name)
      return dbName.includes(targetName) || targetName.includes(dbName)
    })
    
    if (!match) return { kwh: 0, mins: 0, lastSeen: device.lastSeen, dotColor: '#A8A59E', lastActiveLabel: 'No sessions yet', kwhDisplay: '0.000', kwhLabel: 'kWh' }
    
    const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })
    const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })

    const open = match.openSession
    const last = match.lastCompleted

    let lastActiveLabel = 'No sessions yet'
    if (open) {
      lastActiveLabel = `Since ${formatTime(open.session_start)} · Still running`
    } else if (last) {
      lastActiveLabel = `Last active: ${formatDateTime(last.session_end)}`
    }

    let kwhDisplay = '0.000'
    let kwhLabel = 'kWh'
    let kwhColor = 'var(--tx2)'
    
    if (open) {
      kwhDisplay = parseFloat(open.kwh_consumed || 0).toFixed(3)
      kwhLabel = 'kWh · live'
      kwhColor = '#F59E0B'
    } else if (last) {
      kwhDisplay = parseFloat(last.kwh_consumed || 0).toFixed(3)
      kwhLabel = 'kWh · last session'
    }

    const dotColor = open ? '#22C55E' : last ? '#F59E0B' : '#A8A59E'

    const processedSessions = (match.sessions || []).map(s => ({
      start: formatDateTime(s.session_start),
      end: s.session_end ? formatDateTime(s.session_end) : 'Still running',
      dur: s.duration_minutes ? fmt(s.duration_minutes) : 'Running...',
      kwh: parseFloat(s.kwh_consumed || 0),
      quality: s.session_end ? 'complete' : 'live'
    }))

    return { 
      kwh: match.kwh, 
      mins: match.minutes, 
      lastActiveLabel, 
      kwhDisplay, 
      kwhLabel, 
      kwhColor, 
      dotColor,
      totalKwh: match.kwh,
      totalSessions: match.sessions ? match.sessions.length : 0,
      totalMins: match.minutes,
      avgWatts: match.minutes > 0 ? Math.round((match.kwh * 60000) / match.minutes) : 0,
      sessions: processedSessions,
      weekData: match.weekData || []
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 font-['DM_Sans',sans-serif]">
      <style>{`
        :root {
          --Gm:#2D7D46; --Gbg:#E3F5E9; --G:#1F6E3F;
          --Am:#D4880A; --Abg:#FEF3DC; --A:#B87200;
          --Rm:#C0392B; --Rbg:#FDECEA; --R:#A8261E;
          --Bl:#1558A8; --Blbg:#E4EEFF;
          --Pm:#5B3FA6; --Pbg:#EEEAFF;
        }

        .phone-container { max-width: 480px; margin: 0 auto; background: var(--bg); min-height: 100vh; position: relative; }
        
        .hdr { background:white; padding:14px 16px; border-bottom:1px solid var(--b); position:sticky; top:0; z-index:20; }
        .hdr-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
        .hdr-title { font-size:22px; font-weight:500; color:var(--tx); letter-spacing:-.4px; }
        .hdr-sub { font-size:12px; color:var(--tx2); margin-top:2px; }

        .ftabs { display:flex; gap:6px; }
        .ftab { flex:1; text-align:center; font-size:11px; font-weight:600; padding:10px 4px; border-radius:12px; cursor:pointer; background:white; color:var(--tx); border:1.5px solid var(--b2); transition:all .15s; }
        .ftab.active { background:#000; color:#fff; border-color:#000; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        .strip { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 14px; background:white; border-bottom:1px solid var(--b); }
        .sc { background:var(--s2); border-radius:10px; padding:10px; text-align:center; }
        .sc-val { font-size:18px; font-weight:500; color:var(--tx); line-height:1.1; }
        .sc-lbl { font-size:10px; color:var(--tx3); margin-top:3px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }

        .sec-lbl { font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--tx3); margin:18px 0 8px; padding:0 14px; }
        
        .dev-card { 
          background: rgba(227, 245, 233, 0.4); 
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border-radius: 18px; 
          margin: 0 14px 14px; 
          border: 1px solid rgba(45, 125, 70, 0.15); 
          overflow: hidden; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          box-shadow: 0 4px 15px rgba(31, 110, 63, 0.05);
          animation: up .4s ease both;
        }
        .dev-card:hover { 
          background: rgba(227, 245, 233, 0.6);
          transform: translateY(-3px) scale(1.005);
          box-shadow: 0 8px 25px rgba(31, 110, 63, 0.12); 
          border-color: rgba(45, 125, 70, 0.3); 
        }

        .dev-header { padding:14px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; }
        .dev-ico { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative; }
        .status-dot { position:absolute; bottom:1px; right:1px; width:10px; height:10px; border-radius:50%; border:2px solid white; }
        .dev-main { flex:1; min-width:0; }
        .dev-name { font-size:14px; font-weight:500; color:var(--tx); }
        .dev-loc { font-size:11px; color:var(--tx2); margin-top:2px; }
        .dev-right { text-align:right; flex-shrink:0; }
        .dev-kwh { font-size:15px; font-weight:500; color:var(--tx); }
        .dev-meta { font-size:10px; color:var(--tx3); margin-top:2px; }
        .chevron { transition:transform .2s; }
        .chevron.open { transform:rotate(180deg); }

        .dev-detail { border-top:.5px solid var(--b); }
        .detail-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-bottom:.5px solid var(--b); }
        .ds { padding:12px 14px; text-align:center; border-right:.5px solid var(--b); }
        .ds:last-child { border-right:none; }
        .ds-val { font-size:15px; font-weight:500; color:var(--tx); }
        .ds-lbl { font-size:10px; color:var(--tx3); margin-top:2px; letter-spacing:.04em; text-transform:uppercase; }

        .mini-chart-wrap { padding:14px 16px 10px; border-bottom:.5px solid var(--b); }
        .mini-chart-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .mini-chart-title { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--tx3); }
        .mini-bars { display:flex; align-items:flex-end; gap:4px; height:52px; }
        .mb-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; height:100%; }
        .mb-wrap { flex:1; display:flex; flex-direction:column; justify-content:flex-end; width:100%; position:relative; }
        .mb-bar { width:100%; border-radius:3px 3px 0 0; min-height:2px; }
        .mb-lbl { font-size:9px; color:var(--tx3); }
        .mb-today { position:absolute; top:-14px; left:50%; transform:translateX(-50%); font-size:9px; font-weight:700; white-space:nowrap; padding:1px 4px; border-radius:4px; }

        .sessions-wrap { padding:0 16px 12px; }
        .sessions-title { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--tx3); margin:12px 0 8px; }
        .session-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:.5px solid var(--b); }
        .session-row:last-child { border-bottom:none; }
        .s-time { font-size:11px; color:var(--tx2); min-width:80px; }
        .s-dur { font-size:12px; font-weight:500; color:var(--tx); }
        .s-kwh { font-size:12px; color:var(--tx2); margin-left:auto; }
        .s-quality { font-size:9px; font-weight:700; padding:2px 6px; border-radius:8px; }

        .dev-info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:var(--s2); }
        .di-label { font-size:11px; color:var(--tx3); }
        .di-val { font-size:12px; font-weight:500; color:var(--tx2); }

        .no-data { padding:20px 16px; text-align:center; }
        .no-data-ico { width:36px; height:36px; border-radius:50%; background:var(--s2); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }

        @keyframes up {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:translateY(0); }
        }

        .dev-card:nth-child(1) { animation-delay: 0.1s; }
        .dev-card:nth-child(2) { animation-delay: 0.15s; }
        .dev-card:nth-child(3) { animation-delay: 0.2s; }
      `}</style>

      <div className="pb-10">
        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-top">
            <div>
              <div className="hdr-title">Appliances</div>
              <div className="hdr-sub">{totalCount} devices · {devicesWithDataCount} with data · Tapo P110</div>
            </div>
            <button style={{background:'var(--Gm)',color:'white',border:'none',borderRadius:'10px',padding:'7px 14px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',marginTop:'4px'}}>+ Add</button>
          </div>
          <div className="ftabs">
            {[
              { id: 'all', lbl: `All (${totalCount})` },
              { id: 'connected', lbl: `Connected (${totalCount})` },
              { id: 'active', lbl: `Active today (${devicesWithDataCount})` },
              { id: 'no-data', lbl: `No data (${totalCount - devicesWithDataCount})` }
            ].map(t => (
              <div 
                key={t.id} 
                className={`ftab ${filter === t.id ? 'active' : ''}`}
                onClick={() => setFilter(t.id)}
              >
                {t.lbl}
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY STRIP */}
        <div className="strip">
          <div className="sc">
            <div className="sc-val">{loading ? '...' : weekStats.kwh.toFixed(1)} <span style={{fontSize:12,color:'var(--tx2)',fontWeight:400}}>kWh</span></div>
            <div className="sc-lbl">Total · This Week</div>
          </div>
          <div className="sc">
            <div className="sc-val">{loading ? '...' : weekStats.sessions}</div>
            <div className="sc-lbl">Sessions · This Week</div>
          </div>
          <div className="sc">
            <div className="sc-val">{loading ? '...' : weekStats.runtime.toLocaleString()} <span style={{fontSize:10,color:'var(--tx2)',fontWeight:400}}>min</span></div>
            <div className="sc-lbl">Runtime · This Week</div>
          </div>
        </div>

        {/* DEVICE LIST */}
        <div className="pb-10">
          {activeDevs.length > 0 && <div className="sec-lbl">Active · {devicesWithDataCount} devices</div>}
          {activeDevs.map(d => (
            <DeviceCard 
              key={d.id} 
              d={{ ...d, ...getDynamicStats(d) }} 
              isOpen={openId === d.id} 
              toggle={() => setOpenId(openId === d.id ? null : d.id)} 
            />
          ))}

          {noDataDevs.length > 0 && <div className="sec-lbl" style={{marginTop:4}}>No readings yet · {totalCount - devicesWithDataCount} devices</div>}
          {noDataDevs.map(d => (
            <DeviceCard 
              key={d.id} 
              d={{ ...d, ...getDynamicStats(d) }} 
              isOpen={openId === d.id} 
              toggle={() => setOpenId(openId === d.id ? null : d.id)} 
            />
          ))}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}

function DeviceCard({ d, isOpen, toggle }) {
  const icoColor = d.color.replace('var(--Am)','#D4880A').replace('var(--Bl)','#1A5FB4').replace('var(--Gm)','#2D7D46').replace('var(--Rm)','#C0392B')
  const icon = TYPE_ICONS[d.type]?.(icoColor)

  return (
    <div className="dev-card">
      <div className="dev-header" onClick={toggle}>
        <div className="dev-ico" style={{ background: d.bg }}>
          {icon}
          <div className="status-dot" style={{ background: d.dotColor }}></div>
        </div>
        <div className="dev-main">
          <div className="dev-name">{d.name}</div>
          <div className="dev-loc">{d.floor} · {d.room} · {d.brand}</div>
          <div style={{fontSize:10,color:'var(--tx3)',marginTop:3}}>{d.lastActiveLabel}</div>
        </div>
        <div className="dev-right">
          {d.noData ? (
            <>
              <div style={{fontSize:11,color:'var(--tx3)'}}>— kWh</div>
              <div style={{marginTop:2}}><span style={{fontSize:10,fontWeight:700,background:'var(--Abg)',color:'var(--A)',padding:'2px 7px',borderRadius:10}}>No data</span></div>
            </>
          ) : (
            <>
              <div className="dev-kwh" style={{color: d.openSession ? '#F59E0B' : 'var(--tx)'}}>{d.kwhDisplay}<span style={{fontSize:10,color:'var(--tx2)',fontWeight:400}}> {d.kwhLabel}</span></div>
              <div className="dev-meta" style={{fontSize:9}}>week total: {d.kwh.toFixed(1)} kWh · {fmt(d.mins)}</div>
            </>
          )}
          <svg className={`chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginTop:6}}>
            <path d="M4 6l4 4 4-4" stroke="var(--tx3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="dev-detail">
          {d.noData ? <NoDataDetail d={d} /> : <ActiveDetail d={d} />}
        </div>
      )}
    </div>
  )
}

function ActiveDetail({ d }) {
  const daysWithData = d.weekData.length || 1
  const avgDailyKwh = (d.totalKwh / daysWithData).toFixed(1)
  const avgDailyHrs = fmt(Math.round(d.totalMins / daysWithData))
  const maxKwh = d.weekData.length ? Math.max(...d.weekData.map(x => x.kwh), 0.1) : 1
  const activeColor = d.color.replace('var(--Am)','#D4880A').replace('var(--Bl)','#1A5FB4').replace('var(--Gm)','#2D7D46').replace('var(--Rm)','#C0392B')

  return (
    <>
      <div className="detail-stats">
        <div className="ds">
          <div className="ds-val">{d.totalKwh.toFixed(1)}</div>
          <div className="ds-lbl">kWh total</div>
        </div>
        <div className="ds">
          <div className="ds-val">{d.totalSessions}</div>
          <div className="ds-lbl">sessions</div>
        </div>
        <div className="ds">
          <div className="ds-val">{d.avgWatts ? d.avgWatts+'W' : '—'}</div>
          <div className="ds-lbl">avg watts</div>
        </div>
      </div>

      <div className="mini-chart-wrap">
        <div className="mini-chart-hdr">
          <span className="mini-chart-title">Usage trend</span>
          <span style={{fontSize:11,color:'var(--tx2)'}}>Avg {avgDailyKwh} kWh/day · {avgDailyHrs}/day</span>
        </div>
        <div className="mini-bars">
          {d.weekData.map((w, i) => {
            const isToday = i === d.weekData.length - 1
            const h = Math.round(w.kwh / maxKwh * 100)
            return (
              <div key={i} className="mb-col">
                <div className="mb-wrap">
                  {isToday && <div className="mb-today" style={{background:'var(--Abg)',color:'#633806'}}>{w.kwh.toFixed(1)}</div>}
                  <div 
                    className="mb-bar" 
                    style={{
                      height: `${h}%`, 
                      background: isToday ? activeColor : 'var(--s2)',
                      border: isToday ? 'none' : '.5px solid var(--b2)'
                    }}
                  />
                </div>
                <div className="mb-lbl" style={isToday ? {fontWeight:700, color: 'var(--Am)'} : {}}>{w.day}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="sessions-wrap">
        <div className="sessions-title">Recent sessions</div>
        {(d.sessions || []).length > 0 ? (d.sessions || []).slice(0, 5).map((s, i) => (
          <div key={i} className="session-row">
            <div className="s-time">{s.start.includes(', ') ? s.start.split(', ')[1] : s.start}</div>
            <div style={{flex:1}}>
              <div className="s-dur">{s.dur}</div>
              <div style={{fontSize:10,color:'var(--tx3)'}}>{s.start.includes(', ') ? s.start.split(', ')[0] : ''} → {s.end.includes(', ') ? s.end.split(', ')[1] : s.end}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="s-kwh">{s.kwh.toFixed(3)} kWh</div>
              <span className="s-quality" style={{
                background: s.quality === 'complete' ? 'var(--Gbg)' : 'var(--Abg)',
                color: s.quality === 'complete' ? 'var(--G)' : 'var(--A)'
              }}>{s.quality}</span>
            </div>
          </div>
        )) : (
          <div style={{fontSize:12,color:'var(--tx3)',padding:'8px 0'}}>No recent sessions found</div>
        )}
      </div>

      <InfoRow label="Brand" value={d.brand} />
      <InfoRow label="Model" value={d.model} />
      <InfoRow label="Source" value="Tapo P110 · cloud API" />
      <InfoRow label="Controllable" value="Yes · remote on/off" isGreen />
    </>
  )
}

function NoDataDetail({ d }) {
  return (
    <>
      <div className="no-data">
        <div className="no-data-ico">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="var(--tx3)" strokeWidth="1.3"/>
            <path d="M9 6v4" stroke="var(--tx3)" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="9" cy="13" r=".7" fill="var(--tx3)"/>
          </svg>
        </div>
        <div style={{fontSize:13,fontWeight:500,color:'var(--tx)',marginBottom:5}}>No readings received yet</div>
        <div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.55,maxWidth:240,margin:'0 auto'}}>This device is connected to your Tapo account but hasn't logged any sessions. It may not have been switched on yet.</div>
      </div>
      <InfoRow label="Brand" value={d.brand} />
      <InfoRow label="Model" value={d.model || '—'} />
      <InfoRow label="Status" value="Connected · awaiting first session" isAmber />
      <InfoRow label="Source" value="Tapo P110 · cloud API" />
    </>
  )
}

function InfoRow({ label, value, isGreen, isAmber }) {
  return (
    <div className="dev-info-row" style={{ borderTop: '.5px solid var(--b)' }}>
      <span className="di-label">{label}</span>
      <span className="di-val" style={isGreen ? {color:'var(--Gm)'} : isAmber ? {color:'var(--Am)'} : {}}>{value}</span>
    </div>
  )
}
