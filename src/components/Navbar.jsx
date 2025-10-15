import React from 'react'
import { Moon, Sun, Menu } from 'lucide-react'
import { useStore } from '../store/useStore'

/**
 * Navbar
 * - Top bar containing global actions (theme toggle, mobile menu trigger, profile avatar placeholder).
 * - Reads/writes UI state from the global Zustand store (`useStore`).
 */
export default function Navbar(){
  const {theme, toggleTheme, toggleSidebar, sidebarOpen} = useStore()
  // when sidebar is closed we have a fixed toggle at top-left on sm+ screens; add left padding on sm+ so the company name isn't covered
  const leftPadding = sidebarOpen ? '' : 'sm:pl-12'
  return (
  <header className={`flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 ${leftPadding}`}>
      <div className="flex items-center gap-4">
        {/* Mobile menu button: toggles sidebar on small screens */}
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={18} /></button>
  {/* Company name (visible on the top bar) */}
  <div className="text-fastnet font-semibold text-lg">Fastnet</div>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme toggle: switches between light/dark via the store */}
        <button onClick={toggleTheme} title="Toggle theme" className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        {/* Placeholder for user avatar / profile */}
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    </header>
  )
}
