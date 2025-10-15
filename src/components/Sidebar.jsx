import React, { useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Users as UsersIcon, Box, Settings, CreditCard, MessageSquare, GitPullRequest, ChevronLeft, ChevronRight, ChevronDown, Calculator } from 'lucide-react'
import { useStore } from '../store/useStore'

const items = [
  { to: '/', label: 'Dashboard', icon: <Home size={18}/> },
  { to: '/users', label: 'Users', icon: <UsersIcon size={18}/> },
  { to: '/packages', label: 'Packages', icon: <Box size={18}/> },
  { to: '/map', label: 'Map', icon: <Home size={18}/> },
  { to: '/transactions', label: 'Transactions', icon: <CreditCard size={18}/> },
  { to: '/accounting', label: 'Accounting', icon: <Calculator size={18}/> },
  { to: '/sms', label: 'SMS', icon: <MessageSquare size={18}/> },
  { to: '/routers', label: 'Routers', icon: <GitPullRequest size={18}/> },
  { to: '/settings', label: 'Settings', icon: <Settings size={18}/> },
  { to: '/support', label: 'Support', icon: <MessageSquare size={18}/> }
]

/**
 * Sidebar
 * - Renders the main application navigation.
 * - Supports a collapsible state (wide vs compact) using Zustand store.
 * - When collapsed, hovering the Users entry shows an accessible flyout menu.
 *
 * Accessibility notes:
 * - The flyout supports keyboard navigation (ArrowUp/ArrowDown/Home/End/Escape).
 * - Menu items receive focus when the flyout opens via keyboard.
 */
export default function Sidebar(){
  const location = useLocation()
  const sidebarOpen = useStore(state => state.sidebarOpen)
  const toggleSidebar = useStore(state => state.toggleSidebar)
  // close sidebar automatically on small screens when a nav item is clicked
  const closeOnNavigate = React.useCallback(()=>{
    if(typeof window === 'undefined') return
    try{
      if(window.matchMedia && window.matchMedia('(max-width: 767px)').matches){
        // close the sidebar
        toggleSidebar()
      }
    }catch(e){}
  },[toggleSidebar])
  const [usersOpen, setUsersOpen] = React.useState(false)
  const [hoverUsers, setHoverUsers] = React.useState(false)
  const [collapsedFlyoutPersistent, setCollapsedFlyoutPersistent] = React.useState(false)
  const triggerRef = useRef(null)
  const flyoutRef = useRef(null)
  const menuItemRefs = useRef([])
  const sidebarRef = useRef(null)

  // focus first menu item when opened via keyboard (trigger key press)
  useEffect(()=>{
    if(hoverUsers && document.activeElement === triggerRef.current){
      // focus first menu item
      const first = menuItemRefs.current[0]
      first && first.focus()
    }
  },[hoverUsers])

  // Close persistent collapsed flyout when clicking/tapping outside
  React.useEffect(()=>{
    if(!collapsedFlyoutPersistent) return
    function onDoc(e){
      const t = e.target
      if(flyoutRef.current && flyoutRef.current.contains(t)) return
      if(triggerRef.current && triggerRef.current.contains(t)) return
      setHoverUsers(false)
      setCollapsedFlyoutPersistent(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return ()=>{
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  },[collapsedFlyoutPersistent])

  const focusMenuItem = (index)=>{
    const el = menuItemRefs.current[index]
    if(el) el.focus()
  }

  const onFlyoutKeyDown = (e)=>{
    const count = menuItemRefs.current.length
    const idx = menuItemRefs.current.findIndex(r=>r === document.activeElement)
    if(e.key === 'ArrowDown'){
      e.preventDefault()
      const next = (idx + 1) % count
      focusMenuItem(next)
    } else if(e.key === 'ArrowUp'){
      e.preventDefault()
      const prev = (idx - 1 + count) % count
      focusMenuItem(prev)
    } else if(e.key === 'Home'){
      e.preventDefault()
      focusMenuItem(0)
    } else if(e.key === 'End'){
      e.preventDefault()
      focusMenuItem(count-1)
    } else if(e.key === 'Escape'){
      e.preventDefault()
      setHoverUsers(false)
      triggerRef.current && triggerRef.current.focus()
    }
  }

  return (
    <>
      {/* Mobile backdrop: shown only on small screens when sidebar is open */}
      {sidebarOpen && (
        // Use very high z-index values to ensure the sidebar/backdrop overlay sits above iframes (maps)
        <div onClick={toggleSidebar} className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]" />
      )}

      {/* When the sidebar is closed, show only a small toggle button (no icons or menu) */}
      {!sidebarOpen && (
        // hide on small screens because Navbar already has a mobile menu button
        <button onClick={toggleSidebar} aria-label="Open menu" className="hidden sm:block fixed left-3 top-3 z-50 p-2 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight size={18} />
        </button>
      )}

      {/* Keep the aside mounted so we can animate translate-x on open/close. On md+ it remains visible. */}
      <aside
        ref={sidebarRef}
        aria-hidden={!sidebarOpen && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 767px)').matches}
        className={`fixed inset-y-0 left-0 z-[9999] transform transition-transform duration-[var(--transition-medium)] ${sidebarOpen ? 'translate-x-0 md:translate-x-0 pointer-events-auto' : '-translate-x-full md:-translate-x-full pointer-events-none'} md:flex md:flex-col h-screen border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:bg-slate-50 md:dark:bg-slate-900`} 
        style={{ width: 'var(--sidebar-open)' }}
      >
      {/* Mobile header: shows logo and a prominent close button */}
      <div className="p-4 relative flex items-center gap-2 md:justify-start justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="text-fastnet font-semibold text-lg">F</div>
        </div>
        {/* Close button visible on mobile */}
        <div className="md:hidden">
          <button onClick={toggleSidebar} aria-label="Close menu" className="p-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
            <ChevronLeft size={18} />
          </button>
        </div>
        <button onClick={toggleSidebar} className="hidden md:block absolute right-2 top-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      {/* Focus trap when mobile sidebar is open (small screens) */}
      {sidebarOpen && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 767px)').matches && (
        <FocusTrap containerRef={sidebarRef} onDeactivate={toggleSidebar} />
      )}

      <nav className="p-2 flex-1">
        {items.map(i => (
          i.to === '/users' ? (
            <div key={i.to}>
              <div className="relative" onMouseEnter={()=>{ if(!sidebarOpen) setHoverUsers(true)}} onMouseLeave={()=>{ if(!sidebarOpen && !collapsedFlyoutPersistent) setHoverUsers(false)}}>
                <button ref={triggerRef} onKeyDown={(e)=>{
                    if(!sidebarOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')){
                      e.preventDefault()
                      setHoverUsers(true)
                      setCollapsedFlyoutPersistent(true)
                    }
                  }} onClick={()=>{
                    if(sidebarOpen){ setUsersOpen(s=>!s) }
                    else { setHoverUsers(h=>{ const next = !h; if(next) setCollapsedFlyoutPersistent(true); return next }) }
                  }} className={`flex items-center gap-3 p-2 rounded-md my-1 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${location.pathname.startsWith('/users') ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}>
                  <div className="w-6 h-6 flex items-center justify-center">{i.icon}</div>
                  {sidebarOpen && <span className="flex-1">{i.label}</span>}
                  {sidebarOpen && <ChevronDown size={16} className={`${usersOpen ? 'transform rotate-180' : ''}`} />}
                </button>
                {/* Collapsed flyout: show when hovering the users button while sidebar is collapsed */}
                {!sidebarOpen && hoverUsers && (
                  <div
                    ref={flyoutRef}
                    onMouseEnter={()=>{ setHoverUsers(true); if(!collapsedFlyoutPersistent) setCollapsedFlyoutPersistent(false) }}
                    onMouseLeave={()=>{ if(!collapsedFlyoutPersistent) setHoverUsers(false) }}
                    onFocus={()=>{ setHoverUsers(true); setCollapsedFlyoutPersistent(true) }}
                    onBlur={(e)=>{ if(!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) { if(!collapsedFlyoutPersistent) setHoverUsers(false) } }}
                    tabIndex={-1}
                    role="menu"
                    aria-label="Users submenu"
                    onKeyDown={onFlyoutKeyDown}
                    className="absolute left-full top-0 ml-2 w-44 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50"
                  >
                    <Link ref={el=>menuItemRefs.current[0]=el} to="/users/pppoe" role="menuitem" tabIndex={0} onClick={()=>{ setHoverUsers(false); setCollapsedFlyoutPersistent(false); closeOnNavigate() }} className={`block px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${location.pathname === '/users/pppoe' ? 'bg-slate-100 dark:bg-slate-700' : ''}`}>PPPoE</Link>
                    <Link ref={el=>menuItemRefs.current[1]=el} to="/users/hotspot" role="menuitem" tabIndex={0} onClick={()=>{ setHoverUsers(false); setCollapsedFlyoutPersistent(false); closeOnNavigate() }} className={`block px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${location.pathname === '/users/hotspot' ? 'bg-slate-100 dark:bg-slate-700' : ''}`}>Hotspot</Link>
                  </div>
                )}
              </div>
              {usersOpen && sidebarOpen && (
                <div className="ml-8 mt-1">
                  <Link to="/users/pppoe" onClick={closeOnNavigate} className={`block p-1 rounded my-1 hover:bg-slate-100 dark:hover:bg-slate-800 ${location.pathname === '/users/pppoe' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>PPPoE</Link>
                  <Link to="/users/hotspot" onClick={closeOnNavigate} className={`block p-1 rounded my-1 hover:bg-slate-100 dark:hover:bg-slate-800 ${location.pathname === '/users/hotspot' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>Hotspot</Link>
                </div>
              )}
            </div>
          ) : (
            <Link key={i.to} to={i.to} onClick={closeOnNavigate} className={`flex items-center gap-3 p-2 rounded-md my-1 hover:bg-slate-100 dark:hover:bg-slate-800 ${location.pathname===i.to ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''}`}>
              <div className="w-6 h-6 flex items-center justify-center">{i.icon}</div>
              {sidebarOpen && <span>{i.label}</span>}
            </Link>
          )
        ))}
  </nav>

  </aside>
    </>
  )
}

/**
 * FocusTrap
 * - Lightweight focus trap that keeps focus within `containerRef` while active.
 * - onDeactivate is called when Escape is pressed.
 */
function FocusTrap({containerRef, onDeactivate}){
  React.useEffect(()=>{
    if(!containerRef?.current) return
    const container = containerRef.current
    const focusableSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const nodes = Array.from(container.querySelectorAll(focusableSelector)).filter(n=>!n.hasAttribute('disabled'))
    if(nodes.length) nodes[0].focus()
    function handleKey(e){
      if(e.key === 'Escape'){
        e.preventDefault(); onDeactivate && onDeactivate(); return
      }
      if(e.key !== 'Tab') return
      const first = nodes[0]
      const last = nodes[nodes.length -1]
      if(e.shiftKey){
        if(document.activeElement === first){ e.preventDefault(); last.focus() }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return ()=> document.removeEventListener('keydown', handleKey)
  },[containerRef, onDeactivate])
  return null
}
