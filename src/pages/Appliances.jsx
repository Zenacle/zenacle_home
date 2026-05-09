import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHomeData } from '../hooks/useHomeData'
import BottomNav from '../components/BottomNav'

const DEVICES = [
  {
    id:'ea0b66d3-0d00-4a70-8b87-cab8908d9e38',name:'AC — 1st Floor',type:'ac',floor:'1st Floor',room:'Bedroom',
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
    ],
    noData: false
  },
  {
    id:'3b896f6f-0e7f-44ff-acd3-33d82ef11aa7',name:'AC — Ground Floor',type:'ac',floor:'Ground Floor',room:'Living Room',
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
    ],
    noData: false
  },
  {
    id:'ff320fc1-0cbd-4af4-9dcc-98711ce67bde',name:'Water Pump',type:'pump',floor:'Ground Floor',room:'Utility',
    brand:'Haier',model:'—',status:'connected',controllable:true,
    totalKwh:1.33,totalSessions:8,totalMins:181,avgWatts:560,
    todayKwh:0.42,todayMins:55,todaySessions:2,
    lastSeen:'Apr 19, 8:21 AM',
    color:'var(--Gm)',bg:'var(--Gbg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:0.12,mins:15},{day:'15',kwh:0.25,mins:32},
      {day:'16',kwh:0.18,mins:25},{day:'17',kwh:0.22,mins:30},
      {day:'18',kwh:0.14,mins:24},{day:'19',kwh:0.42,mins:55},
    ],
    sessions:[
      {start:'Apr 19, 8:21 AM',end:'Apr 19, 8:51 AM',dur:'30m',kwh:0.23,quality:'complete'},
      {start:'Apr 19, 7:15 AM',end:'Apr 19, 7:40 AM',dur:'25m',kwh:0.19,quality:'complete'},
    ],
    noData: false
  },
  {
    id:'2ec92fd0-d62f-49a2-86e9-a5dafbb5bc6a',name:'Heater — 1st Floor',type:'geyser',floor:'1st Floor',room:'Bathroom',
    brand:'Jaquar',model:'—',status:'connected',controllable:true,
    totalKwh:15.42,totalSessions:12,totalMins:1240,avgWatts:746,
    todayKwh:2.11,todayMins:180,todaySessions:2,
    lastSeen:'Apr 19, 9:21 AM',
    color:'var(--Rm)',bg:'var(--Rbg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:2.46,mins:195},{day:'15',kwh:3.12,mins:240},
      {day:'16',kwh:2.18,mins:185},{day:'17',kwh:2.82,mins:210},
      {day:'18',kwh:2.73,mins:230},{day:'19',kwh:2.11,mins:180},
    ],
    sessions:[
      {start:'Apr 19, 8:21 AM',end:'Apr 19, 10:21 AM',dur:'2h 0m',kwh:1.45,quality:'complete'},
    ],
    noData: false
  },
  {
    id:'a2814a9c-b2ca-4607-9ce9-acf311548440',name:'Heater — Ground Floor',type:'geyser',floor:'Ground Floor',room:'Bathroom',
    brand:'Jaquar',model:'—',status:'connected',controllable:true,
    totalKwh:12.84,totalSessions:10,totalMins:1120,avgWatts:688,
    todayKwh:1.82,todayMins:150,todaySessions:1,
    lastSeen:'Apr 19, 7:46 AM',
    color:'var(--Pm)',bg:'var(--Pbg)',dotColor:'#22C55E',
    weekData:[
      {day:'14',kwh:1.86,mins:145},{day:'15',kwh:2.32,mins:210},
      {day:'16',kwh:1.78,mins:155},{day:'17',kwh:2.52,mins:220},
      {day:'18',kwh:2.54,mins:240},{day:'19',kwh:1.82,mins:150},
    ],
    sessions:[
      {start:'Apr 19, 7:46 AM',end:'Apr 19, 10:16 AM',dur:'2h 30m',kwh:1.82,quality:'complete'},
    ],
    noData: true
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
  const [activeCard, setActiveCard] = useState(0)

  const handleScroll = (e) => {
    const idx = Math.round(e.target.scrollLeft / 230)
    if (idx !== activeCard) setActiveCard(idx)
  }

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
    return { kwh: totalKwh, sessions: totalSessions, runtime: totalRuntime }
  }, [data])

  const getDynamicStats = (device) => {
    const getEmptyWeekData = () => {
      const activeDate = new Date()
      const day = activeDate.getDay()
      const diffToMonday = (day === 0 ? -6 : 1) - day
      const monday = new Date(activeDate)
      monday.setDate(activeDate.getDate() + diffToMonday)
      
      const weekTemplate = []
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekTemplate.push({
          date: d.toLocaleDateString('en-CA'),
          day: dayNames[i],
          kwh: 0,
          mins: 0
        })
      }
      return weekTemplate
    };

    const emptyStats = {
      kwh: 0, mins: 0, lastSeen: device.lastSeen, dotColor: '#A8A59E', lastActiveLabel: 'No sessions this week', 
      kwhDisplay: '0.000', kwhLabel: 'kWh', totalKwh: 0, totalSessions: 0, totalMins: 0, avgWatts: 0, 
      sessions: [], weekData: getEmptyWeekData(), noData: device.noData
    };

    if (!data?.today?.devices) return emptyStats
    
    const match = data.today.devices.find(rd => rd.device_id === device.id)
    
    if (!match) return emptyStats
    
    const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })
    const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true })

    const open = match.openSession
    const last = match.lastCompleted

    let lastActiveLabel = 'No sessions yet'
    let kwhDisplay = '0.000'
    let kwhLabel = 'kWh'
    let kwhColor = 'var(--tx2)'

    if (open) {
      lastActiveLabel = `Since ${formatTime(open.session_start)} · Still running`
      kwhDisplay = parseFloat(open.kwh_consumed || 0).toFixed(3)
      kwhLabel = 'kWh · live'
      kwhColor = '#F59E0B'
    } else if (last) {
      lastActiveLabel = `Last active: ${formatDateTime(last.session_end)}`
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
      totalSessions: match.session_count || 0,
      totalMins: match.minutes,
      avgWatts: match.minutes > 0 ? Math.round((match.kwh * 60000) / match.minutes) : 0,
      sessions: processedSessions,
      weekData: match.weekData || [],
      noData: false
    }
  }

  const dynamicStatsMap = useMemo(() => {
    const map = {}
    DEVICES.forEach(d => {
      map[d.id] = getDynamicStats(d)
    })
    return map
  }, [data])

  const insightData = useMemo(() => {
    if (!data) return null

    const allDeviceStats = DEVICES.map(d => ({
      ...d,
      ...dynamicStatsMap[d.id]
    })).filter(d => !d.noData)

    // Top device this week (highest kwh)
    const topWeek = [...allDeviceStats].sort((a,b) => b.kwh - a.kwh)[0]

    // Top device today (from data.today.devices)
    const todayDevices = data.today?.devices ?? []
    const topToday = [...todayDevices].sort((a,b) => b.kwh - a.kwh)[0]

    // Weekly avg per day for top device (from allDeviceStats)
    const topTodayAvg = topToday
      ? (allDeviceStats.find(d => d.id === topToday.device_id)?.kwh ?? 0) / 7
      : 0

    const topTodayVsAvg = topTodayAvg > 0
      ? Math.round(((topToday?.kwh ?? 0) - topTodayAvg) / topTodayAvg * 100)
      : 0

    // Running right now (open sessions)
    const runningNow = allDeviceStats.filter(d => d.openSession)
    const recentlyIdle = allDeviceStats.filter(d => !d.openSession && d.lastCompleted).slice(0, 2)

    // Longest Session Today
    const longestSessionToday = [...todayDevices].sort((a,b) => (b.minutes || 0) - (a.minutes || 0))[0]

    return {
      topWeek,
      topToday,
      topTodayVsAvg,
      topTodayAvg,
      runningNow,
      recentlyIdle,
      allDeviceStats,
      longestSessionToday
    }
  }, [data, dynamicStatsMap])

  const filteredDevices = useMemo(() => {
    const filtered = DEVICES.filter(d => {
      if (filter === 'all') return true
      if (filter === 'connected') return d.status === 'connected'
      return true
    })

    // Sort by weekly kWh descending
    return filtered.sort((a, b) => {
      if (!data) return 0
      const aKwh = dynamicStatsMap[a.id]?.kwh ?? 0
      const bKwh = dynamicStatsMap[b.id]?.kwh ?? 0
      return bKwh - aKwh
    })
  }, [filter, dynamicStatsMap, data])

  const totalCount = DEVICES.length

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
        {(() => {
          // Define styles for insight cards
          const cardStyle = {
            minWidth: 220,
            maxWidth: 240,
            flexShrink: 0,
            scrollSnapAlign: 'start',
            background: 'white',
            border: '1px solid var(--b)',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          };
          const cardHdr = {
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--tx3)',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          };
          const badge = {
            fontSize: 11,
            padding: '3px 9px',
            borderRadius: 20,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center'
          };

          return (
            <div className="hdr">
              <div className="hdr-top">
                <div>
                  <div className="hdr-title">Appliances</div>
                  <div className="hdr-sub">{totalCount} devices total · {DEVICES.filter(d => d.status === 'connected').length} connected</div>
                </div>
                <button style={{background:'var(--Gm)',color:'white',border:'none',borderRadius:'10px',padding:'7px 14px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',marginTop:'4px'}}>+ Add</button>
              </div>
              <div className="ftabs">
                {[
                  { id: 'all', lbl: `All (${totalCount})` },
                  { id: 'connected', lbl: `Connected (${DEVICES.filter(d => d.status === 'connected').length})` }
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
          )
        })()}

        {/* INSIGHT CARDS */}
        {!insightData && loading ? (
          <div style={{overflowX:'auto', display:'flex', gap:10, padding:'12px 14px'}}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton-card" style={{minWidth:220, height:140, background:'var(--s2)', borderRadius:16, flexShrink:0}} />
            ))}
          </div>
        ) : insightData && (
          <div>
            <div 
              onScroll={handleScroll}
              style={{
                overflowX: 'auto',
                display: 'flex',
                gap: 12,
                padding: '16px 14px 12px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {/* Card 1: Top Week */}
              {(() => {
                const cardStyle = { minWidth: 220, maxWidth: 240, flexShrink: 0, scrollSnapAlign: 'start', background: 'white', border: '1px solid var(--b)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
                const cardHdr = { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--tx3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 };
                const badge = { fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500, display: 'inline-flex', alignItems: 'center' };
                
                return (
                  <>
                    <div style={cardStyle}>
                      <div style={cardHdr}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        TOP DEVICE · THIS WEEK
                      </div>
                      <div style={{fontSize:15, fontWeight:500, color:'var(--tx)'}}>{insightData.topWeek?.name}</div>
                      <div style={{fontSize:12, color:'var(--tx2)', marginBottom:12}}>{insightData.topWeek?.kwh.toFixed(1)} kWh consumed</div>
                      <div style={{display:'flex', flexDirection:'column', gap:6}}>
                        {insightData.allDeviceStats.slice(0, 3).map((d, i) => {
                          const max = insightData.topWeek.kwh || 1
                          const barColor = d.type === 'ac' ? '#378ADD' : d.type === 'pump' ? '#1D9E75' : '#EF9F27'
                          return (
                            <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                              <div style={{fontSize:9, width:50, color:'var(--tx3)', whiteSpace:'nowrap', overflow:'hidden'}}>{d.name.split(' ')[0]}</div>
                              <div style={{flex:1, height:4, background:'var(--b2)', borderRadius:2, position:'relative'}}>
                                <div style={{width:`${(d.kwh/max)*100}%`, height:'100%', background:barColor, borderRadius:2}} />
                              </div>
                              <div style={{fontSize:9, fontWeight:600, color:'var(--tx2)'}}>{d.kwh.toFixed(1)}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Card 2: Top Today */}
                    <div style={cardStyle}>
                      <div style={cardHdr}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        TOP DEVICE · TODAY
                      </div>
                      <div style={{fontSize:15, fontWeight:500, color:'var(--tx)'}}>{insightData.topToday?.name || 'No activity'}</div>
                      <div style={{marginTop:4, marginBottom:10}}>
                        {insightData.topTodayVsAvg > 10 ? (
                          <span style={{...badge, background:'#FCEBEB', color:'#791F1F'}}>↑ {insightData.topTodayVsAvg}% above avg</span>
                        ) : insightData.topTodayVsAvg < -10 ? (
                          <span style={{...badge, background:'#EAF3DE', color:'#27500A'}}>↓ {Math.abs(insightData.topTodayVsAvg)}% below avg</span>
                        ) : (
                          <span style={{...badge, background:'#F1EFE8', color:'#444441'}}>~ on track</span>
                        )}
                      </div>
                      <div style={{display:'flex', gap:10}}>
                        <div style={{flex:1, padding:8, background:'var(--s2)', borderRadius:8}}>
                          <div style={{fontSize:13, fontWeight:600}}>{insightData.topToday?.kwh.toFixed(1) || '0.0'}</div>
                          <div style={{fontSize:9, color:'var(--tx3)'}}>kWh today</div>
                        </div>
                        <div style={{flex:1, padding:8, background:'var(--s2)', borderRadius:8}}>
                          <div style={{fontSize:13, fontWeight:600}}>{insightData.topTodayAvg.toFixed(1)}</div>
                          <div style={{fontSize:9, color:'var(--tx3)'}}>avg/day</div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Running Now */}
                    <div style={cardStyle}>
                      <div style={cardHdr}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        RUNNING NOW
                      </div>
                      {insightData.runningNow.length > 0 ? (
                        <>
                          <div style={{display:'flex', flexDirection:'column', gap:8, flex:1}}>
                            {insightData.runningNow.slice(0, 2).map((d, i) => (
                              <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                                <div style={{width:8, height:8, borderRadius:50, background:'#22C55E'}} />
                                <div style={{fontSize:13, fontWeight:500, flex:1}}>{d.name}</div>
                                <div style={{fontSize:11, color:'var(--tx3)'}}>{d.openSession.duration_minutes ? fmt(d.openSession.duration_minutes) : '0m'}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{fontSize:11, color:'var(--tx3)', marginTop:10}}>~{(insightData.runningNow.length * 0.4).toFixed(1)} kWh/hr estimated usage</div>
                        </>
                      ) : (
                        <>
                          <div style={{fontSize:13, color:'var(--tx3)', margin:'10px 0'}}>No devices running</div>
                          <div style={{display:'flex', flexDirection:'column', gap:6}}>
                            {insightData.recentlyIdle.map((d, i) => (
                              <div key={i} style={{display:'flex', alignItems:'center', gap:8, opacity:0.7}}>
                                <div style={{width:8, height:8, borderRadius:50, background:'#F59E0B'}} />
                                <div style={{fontSize:12}}>{d.name} idle {fmt(Math.round((new Date() - new Date(d.lastCompleted.session_end))/60000))} ago</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Card 4: Longest Session */}
                    <div style={cardStyle}>
                      <div style={cardHdr}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        LONGEST SESSION · TODAY
                      </div>
                      {insightData.longestSessionToday ? (
                        <>
                          <div style={{fontSize:15, fontWeight:500}}>{insightData.longestSessionToday.name}</div>
                          <div style={{fontSize:22, fontWeight:500, margin:'4px 0'}}>{fmt(insightData.longestSessionToday.minutes)}</div>
                          <div style={{fontSize:11, color:'var(--tx3)', marginBottom:8}}>Total runtime today</div>
                          <span style={{...badge, background:'#E6F1FB', color:'#0C447C'}}>{insightData.longestSessionToday.kwh.toFixed(1)} kWh consumed</span>
                        </>
                      ) : (
                        <div style={{fontSize:13, color:'var(--tx3)', marginTop:15}}>No sessions yet today</div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Scroll dots */}
            <div style={{display:'flex', justifyContent:'center', gap:5, marginBottom:10}}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: i === activeCard ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeCard ? 'var(--Gm)' : 'var(--b2)',
                  transition: 'width 0.2s ease'
                }} />
              ))}
            </div>
          </div>
        )}

        {/* DEVICE LIST */}
        <div className="pb-10">
          {filteredDevices.map(d => (
            <DeviceCard 
              key={d.id} 
              d={{ ...d, ...dynamicStatsMap[d.id] }} 
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
  const { household } = useAuth()
  const householdId = household?.id
  const deviceId = d.id

  const getMonday = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d.setDate(diff))
    mon.setHours(0, 0, 0, 0)
    return mon
  }

  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchWeekSessions = async () => {
    if (!householdId || !deviceId || d.noData) return
    setLoading(true)

    const monStart = new Date(weekStart)
    const sunEnd = new Date(weekStart)
    sunEnd.setDate(sunEnd.getDate() + 6)

    const toLocalISO = (d) => {
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const day = String(d.getDate()).padStart(2,'0')
      return `${y}-${m}-${day}`
    }

    const startIST = toLocalISO(monStart) + 'T00:00:00+05:30'
    const endIST = toLocalISO(sunEnd) + 'T23:59:59+05:30'

    const { data, error } = await supabase
      .from('appliance_readings')
      .select('session_start, session_end, kwh_consumed, duration_minutes')
      .eq('device_id', deviceId)
      .eq('household_id', householdId)
      .gte('session_start', new Date(startIST).toISOString())
      .lte('session_start', new Date(endIST).toISOString())
      .order('session_start', { ascending: false })

    if (!error && data) setSessions(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) fetchWeekSessions()
  }, [weekStart, deviceId, householdId, isOpen])

  const weekTotalKwh = sessions.reduce((s, x) => s + parseFloat(x.kwh_consumed ?? 0), 0)
  const weekTotalMins = sessions.reduce((s, x) => s + parseInt(x.duration_minutes ?? 0), 0)
  const weekTotalSessions = sessions.length
  
  const isCurrentWeek = weekStart.getTime() === getMonday(new Date()).getTime()

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
          <div style={{fontSize:10,color:'var(--tx3)',marginTop:3}}>
            {loading ? 'Updating...' : isCurrentWeek ? d.lastActiveLabel : `Selected week total: ${weekTotalKwh.toFixed(1)} kWh`}
          </div>
        </div>
        <div className="dev-right">
          {d.noData ? (
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--tx3)'}}>— kWh</div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--Am)',marginTop:3,textTransform:'uppercase',letterSpacing:'.02em'}}>No data</div>
            </div>
          ) : (
            <div style={{textAlign:'right'}}>
              <div className="dev-kwh" style={{color: !isCurrentWeek ? 'var(--tx)' : d.openSession ? '#F59E0B' : 'var(--tx)'}}>
                {loading ? '...' : isCurrentWeek ? d.kwhDisplay : weekTotalKwh.toFixed(1)}
                <span style={{fontSize:10,color:'var(--tx2)',fontWeight:400}}> kWh</span>
              </div>
              {isCurrentWeek && d.kwhDisplay === '0.000' ? (
                <div style={{fontSize:10,color:'var(--tx3)',marginTop:3,fontWeight:500}}>no sessions this week</div>
              ) : (
                <div style={{fontSize:10,color:'var(--tx3)',marginTop:3}}>{loading ? '...' : fmt(isCurrentWeek ? d.mins : weekTotalMins)}</div>
              )}
            </div>
          )}
          <svg className={`chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginTop:6}}>
            <path d="M4 6l4 4 4-4" stroke="var(--tx3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="dev-detail">
          {d.noData ? <NoDataDetail d={d} /> : (
            <ActiveDetail 
              d={d} 
              sessions={sessions} 
              loading={loading} 
              weekStart={weekStart} 
              setWeekStart={setWeekStart}
              weekTotalKwh={weekTotalKwh}
              weekTotalMins={weekTotalMins}
              weekTotalSessions={weekTotalSessions}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActiveDetail({ d, sessions, loading, weekStart, setWeekStart, weekTotalKwh, weekTotalMins, weekTotalSessions }) {
  const getMonday = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d.setDate(diff))
    mon.setHours(0, 0, 0, 0)
    return mon
  }

  const getSunday = (mondayDate) => {
    const d = new Date(mondayDate)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }

  const toISTDateStr = (utcStr) => {
    const d = new Date(utcStr)
    const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000))
    const y = ist.getUTCFullYear()
    const m = String(ist.getUTCMonth()+1).padStart(2,'0')
    const day = String(ist.getUTCDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  }

  const dayMap = {}
  sessions.forEach(s => {
    const key = toISTDateStr(s.session_start)
    if (!dayMap[key]) dayMap[key] = { kwh: 0, minutes: 0 }
    dayMap[key].kwh += parseFloat(s.kwh_consumed ?? 0)
    dayMap[key].minutes += parseInt(s.duration_minutes ?? 0)
  })

  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const todayIST = toISTDateStr(new Date().toISOString())

  const bars = DAY_LABELS.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = toISTDateStr(d.toISOString())
    
    // Future = after today
    const dayDate = new Date(dateStr)
    const todayDate = new Date(todayIST)
    const isFuture = dayDate > todayDate

    return {
      date: dateStr,
      label,
      kwh: parseFloat((dayMap[dateStr]?.kwh ?? 0).toFixed(3)),
      minutes: dayMap[dateStr]?.minutes ?? 0,
      isToday: dateStr === todayIST,
      isFuture,
    }
  })

  console.log('[Chart] bars:', bars.map(b=>`${b.label}:${b.kwh}`))

  const maxKwh = Math.max(...bars.map(x => x.kwh), 0.1)
  const statsBars = bars.filter(b => !b.isFuture && b.kwh > 0)
  const avgDailyKwh = statsBars.length ? (statsBars.reduce((s,b)=>s+b.kwh,0)/statsBars.length).toFixed(1) : '0.0'
  const avgDailyHrs = statsBars.length ? fmt(Math.round(statsBars.reduce((s,b)=>s+b.minutes,0)/statsBars.length)) : '0m'

  const formatWeekLabel = (monday) => {
    const sunday = getSunday(monday)
    const opts = { day: 'numeric', month: 'short' }
    const start = monday.toLocaleDateString('en-IN', opts)
    const end = sunday.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })
    return `${start} – ${end}`
  }

  const isCurrentWeek = weekStart.getTime() === getMonday(new Date()).getTime()

  const weekAvgWatts = weekTotalMins > 0
    ? Math.round((weekTotalKwh * 60000) / weekTotalMins)
    : 0

  const sundayOfWeek = new Date(weekStart)
  sundayOfWeek.setDate(sundayOfWeek.getDate() + 6)
  
  const formatDay = (d) => d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata'
  })

  const rangeLabel = isCurrentWeek
    ? `${formatDay(new Date())} → ${formatDay(weekStart)}`
    : `${formatDay(sundayOfWeek)} → ${formatDay(weekStart)}`

  const [selectedBar, setSelectedBar] = useState(null)
  
  useEffect(() => {
    setSelectedBar(null)
  }, [weekStart])

  const displaySessions = selectedBar
    ? sessions.filter(s => toISTDateStr(s.session_start) === selectedBar)
    : sessions

  const displayKwh = displaySessions.reduce((s, x) => s + parseFloat(x.kwh_consumed ?? 0), 0)
  const displaySessionCount = displaySessions.length
  const displayMins = displaySessions.reduce((s, x) => s + parseInt(x.duration_minutes ?? 0), 0)
  const displayAvgWatts = displayMins > 0
    ? Math.round((displayKwh * 60000) / displayMins)
    : 0

  let lastDate = null

  return (
    <>
      <div style={{
        fontSize: 11,
        color: 'var(--tx3)',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 500
      }}>
        {selectedBar
          ? new Date(selectedBar).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              timeZone: 'Asia/Kolkata'
            })
          : formatWeekLabel(weekStart)
        }
      </div>

      <div className="detail-stats">
        <div className="ds">
          <div className="ds-val">{loading ? '...' : displayKwh.toFixed(1)}</div>
          <div className="ds-lbl">kWh total</div>
        </div>
        <div className="ds">
          <div className="ds-val">{loading ? '...' : displaySessionCount}</div>
          <div className="ds-lbl">sessions</div>
        </div>
        <div className="ds">
          <div className="ds-val">{loading ? '...' : (displayAvgWatts > 0 ? displayAvgWatts+'W' : '—')}</div>
          <div className="ds-lbl">avg watts</div>
        </div>
      </div>

      <div className="mini-chart-wrap" style={{marginTop:20}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
          <button 
            onClick={() => setWeekStart(prev => {
              const d = new Date(prev)
              d.setDate(d.getDate() - 7)
              return d
            })}
            style={{padding:'4px 8px', background:'var(--s2)', border:'1px solid var(--b)', borderRadius:6, fontSize:12}}
          >
            &lt; Prev
          </button>
          <div style={{fontSize:13, fontWeight:500, color:'var(--tx)'}}>{formatWeekLabel(weekStart)}</div>
          <button 
            disabled={isCurrentWeek}
            onClick={() => setWeekStart(prev => {
              const d = new Date(prev)
              d.setDate(d.getDate() + 7)
              return d
            })}
            style={{padding:'4px 8px', background:isCurrentWeek?'#f0f0f0':'var(--s2)', border:'1px solid var(--b)', borderRadius:6, fontSize:12, opacity:isCurrentWeek?0.5:1}}
          >
            Next &gt;
          </button>
        </div>

        <div className="mini-chart-hdr" style={{borderBottom:'none', paddingBottom:0}}>
          <span className="mini-chart-title">Usage trend</span>
          <span style={{fontSize:11, color:'var(--tx2)'}}>Avg {avgDailyKwh} kWh/day · {avgDailyHrs}/day</span>
        </div>

        {console.log('[Chart] bars data:', bars.map(b => `${b.label}:${b.kwh}`))}
        
        {/* Chart container */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '120px',
          gap: '8px',
          padding: '0 0 8px 0',
          borderBottom: '1px solid var(--b)'
        }}>
          {bars.map((bar, i) => {
            const maxKwh = Math.max(...bars.map(b => b.kwh), 0.1)
            const heightPct = bar.kwh > 0 
              ? Math.max((bar.kwh / maxKwh) * 100, 6) 
              : 0
            const isToday = bar.isToday
            const isFuture = bar.isFuture
            const isSelected = selectedBar === bar.date
            
            return (
              <div 
                key={i} 
                onClick={() => {
                  if (isFuture) return
                  setSelectedBar(isSelected ? null : bar.date)
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  gap: '4px',
                  cursor: isFuture ? 'default' : 'pointer',
                  opacity: selectedBar && !isSelected ? 0.3 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              >
                {/* kWh label above bar */}
                <span style={{
                  fontSize: '10px',
                  color: isToday 
                    ? '#BA7517' 
                    : 'var(--tx2)',
                  fontWeight: '500',
                  minHeight: '14px'
                }}>
                  {bar.kwh > 0 ? bar.kwh.toFixed(1) : ''}
                </span>

                {/* The bar itself */}
                <div style={{
                  width: '100%',
                  height: bar.kwh > 0 ? `${heightPct}%` : '3px',
                  backgroundColor: isFuture
                    ? 'var(--b)'
                    : isToday && bar.kwh === 0
                      ? '#F5D88A'          // light amber for today/zero
                      : isToday
                        ? '#EF9F27'        // amber for today with data
                        : bar.kwh > 0
                          ? '#378ADD'      // blue for past with data
                          : 'var(--b)',    // gray for past zero
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease',
                  minHeight: '3px',
                  outline: isSelected ? '2px solid #BA7517' : 'none',
                  outlineOffset: '2px',
                  zIndex: isSelected ? 2 : 1
                }} />
              </div>
            )
          })}
        </div>

        {/* Tap hint */}
        {!selectedBar && !loading && (
          <div style={{fontSize:10, color:'var(--tx3)', textAlign:'center', marginTop:6}}>
            tap a bar to see that day
          </div>
        )}
        {selectedBar && (
          <div style={{fontSize:10, color:'#BA7517', textAlign:'center', marginTop:6, fontWeight:500}}>
            tap again to show full week
          </div>
        )}

        {/* X axis labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px'
        }}>
          {bars.map((bar, i) => (
            <div key={i} style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '11px',
              color: bar.isToday 
                ? '#BA7517' 
                : 'var(--tx2)',
              fontWeight: bar.isToday ? '500' : '400'
            }}>
              {bar.label}
            </div>
          ))}
        </div>
      </div>

      <div className="sessions-wrap">
        <div className="sessions-title">
          {selectedBar
            ? `Sessions on ${new Date(selectedBar).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
              })} (${displaySessionCount})`
            : `Sessions · ${rangeLabel} (${sessions.length})`
          }
        </div>
        {loading ? <div style={{padding:20, textAlign:'center', color:'var(--tx3)'}}>Loading...</div> : 
         displaySessions.length > 0 ? displaySessions.map((s, i) => {
          const sessionDate = new Date(s.session_start).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            timeZone: 'Asia/Kolkata'
          })
          const showDateHeader = !selectedBar && (sessionDate !== lastDate)
          lastDate = sessionDate
          
          return (
            <React.Fragment key={i}>
              {showDateHeader && (
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tx3)',
                  padding: '12px 0 6px',
                  borderBottom: '0.5px solid var(--b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: i > 0 ? 8 : 0
                }}>
                  {sessionDate}
                </div>
              )}
              <div className="session-row">
                <div className="s-time">{new Date(s.session_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                <div style={{flex:1}}>
                  <div className="s-dur">{s.duration_minutes ? fmt(s.duration_minutes) : 'Running...'}</div>
                  <div style={{fontSize:10,color:'var(--tx3)'}}>{new Date(s.session_start).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} → {s.session_end ? new Date(s.session_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'Still running'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="s-kwh">{parseFloat(s.kwh_consumed || 0).toFixed(3)} kWh</div>
                  <div style={{marginTop:4}}><span style={{fontSize:9,fontWeight:700,background:s.session_end?'var(--Gbg)':'var(--Abg)',color:s.session_end?'var(--G)':'var(--A)',padding:'2px 7px',borderRadius:10}}>{s.session_end ? 'complete' : 'live'}</span></div>
                </div>
              </div>
            </React.Fragment>
          )
        }) : (
          <div style={{padding:20, textAlign:'center', color:'var(--tx3)', fontSize:13}}>
            {selectedBar 
              ? `No sessions on ${new Date(selectedBar).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}`
              : `No sessions from ${formatDay(weekStart)} to ${formatDay(sundayOfWeek)}`
            }
          </div>
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
