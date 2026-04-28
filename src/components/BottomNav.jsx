import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 4l9 8" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 10.5v7.5a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-7.5" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/usage',
    label: 'Usage',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L6 14h7l-2 7 9-11h-7l2-7z" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 17l5-5 4 4 7-8" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={active ? '#2D7D46' : '#A8A59E'} strokeWidth="1.6"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const [showUsageMenu, setShowUsageMenu] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUsageMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  return (
    <div ref={menuRef} className="fixed bottom-0 left-0 right-0 z-50">
      
      <nav className="bg-surface border-t border-black/10 safe-bottom">
        <div className="flex justify-around items-center px-2 pt-2 pb-4">
          {tabs.map((tab) => {
            if (tab.label === 'Usage') {
              const isUsageActive = location.pathname.startsWith('/usage') || location.pathname === '/appliances'
              const iconActive = isUsageActive || showUsageMenu
              
              return (
                <button
                  key="usage-dropdown"
                  onClick={() => setShowUsageMenu(!showUsageMenu)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors relative"
                >
                  {showUsageMenu && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E9E4FC] py-2 w-[140px] flex flex-col z-[60]">
                      <NavLink
                        to="/usage/energy"
                        onClick={() => setShowUsageMenu(false)}
                        className={({ isActive }) => `px-5 py-3 text-[14px] font-semibold transition-colors ${isActive ? 'text-[#2D7D46] bg-[#2D7D46]/5' : 'text-[#2A2A2A] hover:bg-black/5'}`}
                      >
                        Energy
                      </NavLink>
                      <div className="h-[1px] bg-black/5 mx-2" />
                      <NavLink
                        to="/usage/water"
                        onClick={() => setShowUsageMenu(false)}
                        className={({ isActive }) => `px-5 py-3 text-[14px] font-semibold transition-colors ${isActive ? 'text-[#2D7D46] bg-[#2D7D46]/5' : 'text-[#2A2A2A] hover:bg-black/5'}`}
                      >
                        Water
                      </NavLink>
                      <div className="h-[1px] bg-black/5 mx-2" />
                      <NavLink
                        to="/usage/waste"
                        onClick={() => setShowUsageMenu(false)}
                        className={({ isActive }) => `px-5 py-3 text-[14px] font-semibold transition-colors ${isActive ? 'text-[#2D7D46] bg-[#2D7D46]/5' : 'text-[#2A2A2A] hover:bg-black/5'}`}
                      >
                        Waste
                      </NavLink>
                    </div>
                  )}
                  {tab.icon(iconActive)}
                  <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${iconActive ? 'text-green-mid' : 'text-tx-3'}`}>
                    {tab.label}
                  </span>
                  {iconActive && (
                    <div className="w-1 h-1 rounded-full bg-green-mid" />
                  )}
                </button>
              )
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors"
                style={({ isActive }) =>isActive ? {backgroundColor: 'rgba(45, 125, 70, 0.05)'} : {}}
              >
                {({ isActive }) => (
                  <>
                    {tab.icon(isActive)}
                    <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${isActive ? 'text-green-mid' : 'text-tx-3'}`}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="w-1 h-1 rounded-full bg-green-mid" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
