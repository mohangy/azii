import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UsersPPPoE from './pages/UsersPPPoE'
import UsersHotspot from './pages/UsersHotspot'
import UserDetail from './pages/UserDetail'
import Packages from './pages/Packages'
import Transactions from './pages/Transactions'
import SMS from './pages/SMS'
import Routers from './pages/Routers'
import Settings from './pages/Settings'
import Support from './pages/Support'
import Map from './pages/Map'
import Accounting from './pages/Accounting'

/**
 * App routing
 * - Central route map. Uses a Layout component at the root which contains the Sidebar and Navbar.
 * - Nested routing for Users (/users -> Users component serves as a parent and exposes <Outlet/>).
 * - Important localStorage keys used across the app:
 *   - `fastnet:settings` -> UI settings (theme, sidebar state)
 *   - `fastnet:users` -> locally added/edited users (merged with `src/data/mockUsers.json` at runtime)
 *   - `fastnet:transactions` -> locally created transactions/receipts
 */
class ErrorBoundary extends React.Component{
  constructor(props){
    super(props)
    this.state = { error: null, info: null }
  }
  componentDidCatch(error, info){
    this.setState({ error, info })
    // also log to console
    console.error('ErrorBoundary caught', error, info)
  }
  render(){
    if(this.state.error){
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-600">An error occurred</h2>
          <div className="mt-4 text-sm text-slate-700 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900 p-4 rounded">
            <div className="font-medium">{String(this.state.error && this.state.error.toString())}</div>
            <pre className="mt-2 text-xs overflow-auto max-h-80">{this.state.info && this.state.info.componentStack}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout/>}>
          <Route index element={<Dashboard/>} />
          <Route path="users" element={<Users/>}>
            <Route path="pppoe" element={<UsersPPPoE/>} />
            <Route path="hotspot" element={<UsersHotspot/>} />
            <Route path=":username" element={<UserDetail/>} />
          </Route>
          <Route path="packages" element={<Packages/>} />
          <Route path="map" element={<Map/>} />
          <Route path="transactions" element={<Transactions/>} />
          <Route path="accounting" element={<Accounting/>} />
          <Route path="sms" element={<SMS/>} />
          <Route path="routers" element={<Routers/>} />
          <Route path="settings" element={<Settings/>} />
          <Route path="support" element={<Support/>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
