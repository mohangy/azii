import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { Link, useLocation } from 'react-router-dom'
import { fetchMock } from '../services/api'
import { bestNormalizedDistance } from '../utils/fuzzy'
import { useStore } from '../store/useStore'

export default function UsersHotspot(){
  const [open, setOpen] = React.useState(false)
  const [users, setUsers] = React.useState([])
  const [packages, setPackages] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const [form, setForm] = React.useState({
    username: 'hotuser1',
    password: 'hotpass',
    names: '',
    email: '',
    phone: '',
    location: '',
    package: 'Hotspot Daily 1 Mbps',
    expiry: ''
  })

  React.useEffect(()=>{
    let mounted = true
    Promise.all([fetchMock('mockUsers'), fetchMock('mockPackages')]).then(([u,p])=>{
      if(!mounted) return
      let persisted = []
      try{ const s = localStorage.getItem('fastnet:users'); persisted = s ? JSON.parse(s) : [] }catch(e){}
      setUsers([...(persisted || []), ...(u || [])])
      setPackages(p || [])
      setLoading(false)
    })
    return ()=> mounted = false
  },[])

  const [routerList, setRouterList] = React.useState([])
  // search & filters
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState(search)
  const [filterStatus, setFilterStatus] = React.useState('')
  const [filterPackage, setFilterPackage] = React.useState('')
  const [filterLocation, setFilterLocation] = React.useState('')
  const [searchSettings, setSearchSettings] = React.useState({ enableFuzzy: true, fuzzyThreshold: 0.4, debounceMs: 250, maxResults: 200 })
  
  // Modal states for dropdowns
  const [statusModal, setStatusModal] = React.useState(false)
  const [packageModal, setPackageModal] = React.useState(false)
  const [locationModal, setLocationModal] = React.useState(false)
  const [formPackageModal, setFormPackageModal] = React.useState(false)
  const [formRouterModal, setFormRouterModal] = React.useState(false)

  React.useEffect(()=>{
    try{ const s = localStorage.getItem('fastnet:settings'); if(s){ const parsed = JSON.parse(s); if(parsed.search) setSearchSettings(st=>({...st, ...parsed.search})) } }catch(e){}
  },[])

  // apply filters from URL query params (e.g. ?status=Active&package=Monthly)
  const location = useLocation()
  React.useEffect(()=>{
    try{
      const q = new URLSearchParams(location.search)
      const status = q.get('status') || ''
      const pkg = q.get('package') || ''
      const loc = q.get('location') || ''
      if(status) setFilterStatus(status)
      if(pkg) setFilterPackage(pkg)
      if(loc) setFilterLocation(loc)
    }catch(e){}
  },[location.search])

  React.useEffect(()=>{
    const delay = (searchSettings && searchSettings.debounceMs) ? Number(searchSettings.debounceMs) : 250
    const t = setTimeout(()=> setDebouncedSearch(search), delay)
    return ()=> clearTimeout(t)
  },[search, searchSettings])
  React.useEffect(()=>{
    let mounted = true
    fetchMock('mockRouters').then(r=>{ if(mounted) setRouterList(r || []) })
    return ()=> mounted = false
  },[])

  // Selection handlers for modals
  const selectStatus = (status) => {
    setFilterStatus(status)
    setStatusModal(false)
  }

  const selectPackage = (pkg) => {
    setFilterPackage(pkg)
    setPackageModal(false)
  }

  const selectLocation = (loc) => {
    setFilterLocation(loc)
    setLocationModal(false)
  }

  const selectFormPackage = (pkg) => {
    setForm(f => ({ ...f, package: pkg }))
    setFormPackageModal(false)
  }

  const selectFormRouter = (routerId) => {
    setForm(f => ({ ...f, routerId }))
    setFormRouterModal(false)
  }

  const save = ()=>{
    const addToast = useStore.getState().addToast
    if(!form.username.trim() || !form.password.trim() || !form.names.trim() || !form.package.trim()){
      addToast('Please fill required fields: Username, Password, Names and Package', 'error')
      return
    }
    const newUser = {
      username: form.username,
      type: 'Hotspot',
      package: form.package,
      status: 'Active',
      createdAt: new Date().toISOString(),
      names: form.names,
      email: form.email,
      phone: form.phone,
      location: form.location,
      expiry: form.expiry
    }
    if(form.routerId){
      const r = routerList.find(x=>String(x.id) === String(form.routerId))
      if(r){ newUser.routerId = r.id; newUser.ip = r.ip }
    }
    setUsers(u => {
      const next = [newUser, ...u]
      try{ const s = localStorage.getItem('fastnet:users'); const arr = s? JSON.parse(s): []; arr.unshift(newUser); localStorage.setItem('fastnet:users', JSON.stringify(arr)) }catch(e){}
      return next
    })
    setOpen(false)
    setForm({username:'', password:'', names:'', email:'', phone:'', location:'', package:'Hotspot Daily 1 Mbps', expiry:''})
    addToast('Hotspot user added (local)', 'success')
  }

  const hotspotUsers = React.useMemo(()=> users.filter(u=>u.type === 'Hotspot'), [users])
  const uniqueLocations = React.useMemo(() => (
    [...new Set(hotspotUsers.map(u => u.location).filter(Boolean))]
  ), [hotspotUsers])

  const filtered = React.useMemo(()=>{
    const q = debouncedSearch.trim()
    let base = hotspotUsers.filter(u=>{
      if(filterStatus && (u.status||'') !== filterStatus) return false
      if(filterPackage && (u.package||'') !== filterPackage) return false
      if(filterLocation && (u.location||'') !== filterLocation) return false
      return true
    })
    if(!q) return base
    let scored
    if(!searchSettings || searchSettings.enableFuzzy === false){
      scored = base.filter(u=>{
        const s = q.toLowerCase()
        return (u.username||'').toLowerCase().includes(s) || (u.names||'').toLowerCase().includes(s) || (u.phone||'').toLowerCase().includes(s) || (u.email||'').toLowerCase().includes(s)
      }).map(u=>({ u, score: 0 }))
    } else {
      scored = base.map(u=>({ u, score: bestNormalizedDistance(q, [u.username, u.names, u.phone, u.email]) }))
        .filter(x=> x.score <= (searchSettings && searchSettings.fuzzyThreshold ? Number(searchSettings.fuzzyThreshold) : 0.4))
    }
    scored.sort((a,b)=> a.score - b.score)
    const max = (searchSettings && searchSettings.maxResults) ? Number(searchSettings.maxResults) : 200
    return scored.slice(0, max).map(s=>s.u)
  },[hotspotUsers, debouncedSearch, filterStatus, filterPackage, filterLocation])

  const columns = [
    { key: 'username', title: 'Username', render: r => <Link className="text-blue-600" to={`/users/${r.username}`}>{r.username}</Link> },
    { key: 'names', title: 'Names', render: (r)=> r.names || '-' },
    { key: 'phone', title: 'Phone', render: r=> r.phone || '-' },
    { key: 'activity', title: 'Activity', className: 'hidden md:table-cell', render: r => (r.lastActivity ? r.lastActivity : (r.createdAt ? `Created ${new Date(r.createdAt).toLocaleString()}` : '-')) },
    { key: 'status', title: 'Status' },
    { key: 'expiry', title: 'Expiry', className: 'hidden md:table-cell', render: r => r.expiry || '-' },
    { key: 'package', title: 'Package', className: 'hidden md:table-cell' }
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Hotspot Users <span className="text-sm text-slate-500">({filtered.length})</span></h2>
          <div className="text-sm text-slate-500">Showing {filtered.length} of {hotspotUsers.length}</div>
          <div className="text-xs text-slate-400 mt-1">Search: {searchSettings && searchSettings.enableFuzzy ? `fuzzy (th=${searchSettings.fuzzyThreshold}, debounce=${searchSettings.debounceMs}ms)` : `substring (debounce=${searchSettings.debounceMs}ms)`}</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
          <input placeholder="Search username, name, phone or email" className="px-3 py-1 border rounded w-full sm:w-auto flex-1 min-w-0" value={search} onChange={e=>setSearch(e.target.value)} />
          <button
            onClick={() => setStatusModal(true)}
            className="px-2 py-1 border rounded text-sm w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 min-w-[120px] dark:bg-slate-800 dark:border-slate-600"
          >
            <span>{filterStatus || 'All status'}</span>
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setPackageModal(true)}
            className="px-2 py-1 border rounded text-sm w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 min-w-[130px] dark:bg-slate-800 dark:border-slate-600"
          >
            <span className="truncate">{filterPackage || 'All packages'}</span>
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setLocationModal(true)}
            className="px-2 py-1 border rounded text-sm w-full sm:w-auto hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2 min-w-[130px] dark:bg-slate-800 dark:border-slate-600"
          >
            <span className="truncate">{filterLocation || 'All locations'}</span>
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 w-full sm:w-auto px-3 py-1.5 bg-fastnet text-white rounded hover:opacity-95">+ Add User</button>
          </div>
        </div>
      </div>

      <Card>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table columns={columns} data={filtered} />
        )}
      </Card>

      <Modal open={open} onClose={()=>setOpen(false)} title="New Hotspot User">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Hotspot Username* required</label>
            <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm">Password* required</label>
            <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm">Names* required (E.g john doe)</label>
            <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.names} onChange={e=>setForm(f=>({...f, names:e.target.value}))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Email (optional)</label>
              <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Phone</label>
              <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">Location (optional)</label>
            <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm">Select Package:* required</label>
            <button
              type="button"
              onClick={() => setFormPackageModal(true)}
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <span>{form.package || 'Select a package'}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-sm">Assign Router (optional)</label>
            <button
              type="button"
              onClick={() => setFormRouterModal(true)}
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <span>{form.routerId ? routerList.find(r => r.id === form.routerId)?.name + ' (' + routerList.find(r => r.id === form.routerId)?.ip + ')' : '-- none --'}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-sm">Select Expiry Date (recommended)</label>
            <input type="date" className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.expiry} onChange={e=>setForm(f=>({...f, expiry:e.target.value}))} />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setOpen(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button onClick={save} className="px-3 py-1 rounded bg-fastnet text-white">Save</button>
          </div>
        </div>
      </Modal>

      {/* Status Filter Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Status</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => selectStatus('')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              !filterStatus ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">All Status</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Show all users</div>
          </button>
          <button
            onClick={() => selectStatus('Active')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              filterStatus === 'Active' ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">Active</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Users with active service</div>
          </button>
          <button
            onClick={() => selectStatus('Disabled')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              filterStatus === 'Disabled' ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">Disabled</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Temporarily disabled users</div>
          </button>
          <button
            onClick={() => selectStatus('Suspended')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              filterStatus === 'Suspended' ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">Suspended</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Suspended accounts</div>
          </button>
        </div>
      </Modal>

      {/* Package Filter Modal */}
      <Modal open={packageModal} onClose={() => setPackageModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Package</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => selectPackage('')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              !filterPackage ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">All Packages</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Show all packages</div>
          </button>
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => selectPackage(pkg.name)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                filterPackage === pkg.name ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-medium">{pkg.name}</div>
              {pkg.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Location Filter Modal */}
      <Modal open={locationModal} onClose={() => setLocationModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Location</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => selectLocation('')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              !filterLocation ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">All Locations</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Show all locations</div>
          </button>
          {uniqueLocations.map(loc => (
            <button
              key={loc}
              onClick={() => selectLocation(loc)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                filterLocation === loc ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-medium">{loc}</div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Form Package Selection Modal */}
      <Modal open={formPackageModal} onClose={() => setFormPackageModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Package</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => selectFormPackage('Hotspot Daily 1 Mbps')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              form.package === 'Hotspot Daily 1 Mbps' ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">Hotspot Daily 1 Mbps</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Default package</div>
          </button>
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => selectFormPackage(pkg.name)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                form.package === pkg.name ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-medium">{pkg.name}</div>
              {pkg.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Form Router Assignment Modal */}
      <Modal open={formRouterModal} onClose={() => setFormRouterModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Assign Router</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => selectFormRouter('')}
            className={`w-full text-left p-3 rounded border transition-colors ${
              !form.routerId ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">No Router</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Don't assign a router</div>
          </button>
          {routerList.map(router => (
            <button
              key={router.id}
              onClick={() => selectFormRouter(router.id)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                form.routerId === router.id ? 'bg-fastnet/10 border-fastnet' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="font-medium">{router.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{router.ip}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
