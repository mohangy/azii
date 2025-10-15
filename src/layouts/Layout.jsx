import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useStore } from '../store/useStore'
import Toaster from '../components/Toaster'

export default function Layout(){
  const sidebarOpen = useStore(state => state.sidebarOpen)
  return (
    <div className="app-shell flex">
      <Sidebar />
      {/* Reserve left margin only on md+ when sidebar is open; on mobile the sidebar overlays the UI */}
      <div className={`flex-1 min-h-screen transition-all duration-200 ${sidebarOpen ? 'md:ml-[var(--sidebar-open)]' : 'md:ml-0'}`}>
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
