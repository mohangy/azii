import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { Link, useLocation } from 'react-router-dom'
import { fetchMock } from '../services/api'
import { useStore } from '../store/useStore'
import { bestNormalizedDistance } from '../utils/fuzzy'

export default function UsersPPPoE(){
  const [open, setOpen] = React.useState(false)
  const [users, setUsers] = React.useState([])
  const [packages, setPackages] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const [form, setForm] = React.useState({
    username: 'user1234',
    password: 'user1234',
    names: '',
    email: '',
    phone: '',
    location: '',
    coords: '',
    apartment: '',
    house: '',
    package: 'Monthly 7 Mbps',
    expiry: ''
  })
  const [smsOpen, setSmsOpen] = React.useState(false)
  const [smsToAll, setSmsToAll] = React.useState(true)
  const [smsList, setSmsList] = React.useState('')
  const [smsMessage, setSmsMessage] = React.useState('')
  const [smsSending, setSmsSending] = React.useState(false)
  const [smsFilterLocation, setSmsFilterLocation] = React.useState('')
  const [smsFilterUserStatus, setSmsFilterUserStatus] = React.useState('')
  const [smsFilterAccountStatus, setSmsFilterAccountStatus] = React.useState('')

  React.useEffect(()=>{
    let mounted = true
    Promise.all([fetchMock('mockUsers'), fetchMock('mockPackages')]).then(([u,p])=>{
      if(!mounted) return
      // merge persisted users and routers
      let persisted = []
      try{ const s = localStorage.getItem('fastnet:users'); persisted = s ? JSON.parse(s) : [] }catch(e){}
      setUsers([...(persisted || []), ...(u || [])])
      setPackages(p || [])
      setLoading(false)
    })
    return ()=> mounted = false
  },[])

  // load routers for selection
  React.useEffect(()=>{
    let mounted = true
    fetchMock('mockRouters').then(r=>{ if(mounted) setRouterList(r || []) })
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
  const [smsLocationModal, setSmsLocationModal] = React.useState(false)
  const [smsUserStatusModal, setSmsUserStatusModal] = React.useState(false)
  const [smsAccountStatusModal, setSmsAccountStatusModal] = React.useState(false)

  // load search settings from localStorage and apply debounce delay
  React.useEffect(()=>{
    try{
      const s = localStorage.getItem('fastnet:settings')
      if(s){ const parsed = JSON.parse(s); if(parsed.search) setSearchSettings(st => ({...st, ...parsed.search})) }
    }catch(e){}
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

  const selectSmsLocation = (loc) => {
    setSmsFilterLocation(loc)
    setSmsLocationModal(false)
  }

  const selectSmsUserStatus = (status) => {
    setSmsFilterUserStatus(status)
    setSmsUserStatusModal(false)
  }

  const selectSmsAccountStatus = (status) => {
    setSmsFilterAccountStatus(status)
    setSmsAccountStatusModal(false)
  }

  const save = ()=>{
    const addToast = useStore.getState().addToast
    // basic validation for required fields
    if(!form.username.trim() || !form.password.trim() || !form.names.trim() || !form.package.trim()){
      addToast('Please fill required fields: Username, Password, Names and Package', 'error')
      return
    }

    const newUser = {
      username: form.username,
      type: 'PPPoE',
      package: form.package,
      status: 'Active',
      createdAt: new Date().toISOString(),
      names: form.names,
      email: form.email,
      phone: form.phone,
      location: form.location,
      coords: form.coords,
      apartment: form.apartment,
      house: form.house,
      expiry: form.expiry
    }
    // attach router info if selected
    if(form.routerId){
      const r = routerList.find(x=>String(x.id) === String(form.routerId))
      if(r){ newUser.routerId = r.id; newUser.ip = r.ip }
    }
    // normalize coords to 'lat,lon' (floats)
    if(form.coords){
      try{
        const parts = String(form.coords).split(',').map(s=>s.trim())
        if(parts.length >= 2){
          const lat = parseFloat(parts[0]); const lon = parseFloat(parts[1])
          if(!isNaN(lat) && !isNaN(lon)){
            newUser.coords = `${lat.toFixed(6)},${lon.toFixed(6)}`
          }
        }
      }catch(e){ /* ignore malformed */ }
    }
    setUsers(u => {
      const next = [newUser, ...u]
      try{ const s = localStorage.getItem('fastnet:users'); const arr = s? JSON.parse(s): []; arr.unshift(newUser); localStorage.setItem('fastnet:users', JSON.stringify(arr)) }catch(e){}
      return next
    })
  setOpen(false)
    // reset form to sensible defaults
    setForm({username:'', password:'', names:'', email:'', phone:'', location:'', coords:'', apartment:'', house:'', package:'Monthly 7 Mbps', expiry:''})
    console.log('Added PPPoE user', newUser)
  }

  const pppoeUsers = React.useMemo(()=> users.filter(u=>u.type === 'PPPoE'), [users])

  const filtered = React.useMemo(()=>{
    const q = debouncedSearch.trim()
    // first apply strict filters
    let base = pppoeUsers.filter(u=>{
      if(filterStatus && (u.status||'') !== filterStatus) return false
      if(filterPackage && (u.package||'') !== filterPackage) return false
      if(filterLocation && (u.location||'') !== filterLocation) return false
      return true
    })
    if(!q) return base
    // compute fuzzy score for each candidate and include ones within threshold
    let scored
    if(!searchSettings || searchSettings.enableFuzzy === false){
      // substring matching
      scored = base.filter(u=>{
        const s = q.toLowerCase()
        return (u.username||'').toLowerCase().includes(s) || (u.names||'').toLowerCase().includes(s) || (u.phone||'').toLowerCase().includes(s) || (u.email||'').toLowerCase().includes(s)
      }).map(u=>({ u, score: 0 }))
    } else {
      scored = base.map(u=>{
        const score = bestNormalizedDistance(q, [u.username, u.names, u.phone, u.email])
        return { u, score }
      }).filter(x=> x.score <= (searchSettings && searchSettings.fuzzyThreshold ? Number(searchSettings.fuzzyThreshold) : 0.4))
    }
    // sort by score ascending (best matches first)
    scored.sort((a,b)=> a.score - b.score)
    const max = (searchSettings && searchSettings.maxResults) ? Number(searchSettings.maxResults) : 200
    return scored.slice(0, max).map(s=>s.u)
  },[pppoeUsers, debouncedSearch, filterStatus, filterPackage, filterLocation])

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
          <h2 className="text-xl font-semibold">PPPoE Users <span className="text-sm text-slate-500">({filtered.length})</span></h2>
          <div className="text-sm text-slate-500">Showing {filtered.length} of {pppoeUsers.length}</div>
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
            <button onClick={()=>setSmsOpen(true)} className="inline-flex items-center gap-2 w-full sm:w-auto px-3 py-1.5 border rounded">Send SMS</button>
          </div>
        </div>
      </div>

      {/* Developer helpers removed for production */}

      <Card>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table columns={columns} data={filtered} />
        )}
      </Card>

      <Modal open={open} onClose={()=>setOpen(false)} title="New User">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">PPPoE Username* required</label>
            <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))} />
          </div>

          <div>
            <label className="block text-sm">PPPoE Password* required</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Location (optional)</label>
              <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Coordinates (optional)</label>
              <input placeholder="-3.5000,35.4000" className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.coords} onChange={e=>setForm(f=>({...f, coords:e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Apartment Number (optional)</label>
              <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.apartment} onChange={e=>setForm(f=>({...f, apartment:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">House Number (optional)</label>
              <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={form.house} onChange={e=>setForm(f=>({...f, house:e.target.value}))} />
            </div>
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

      <Modal open={smsOpen} onClose={()=>{ setSmsOpen(false); setSmsMessage(''); setSmsList(''); setSmsToAll(true); setSmsSending(false) }} title="Send SMS to PPPoE users">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Message*</label>
            <textarea className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" rows={4} value={smsMessage} onChange={e=>setSmsMessage(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Recipients</label>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-2"><input type="radio" checked={smsToAll} onChange={()=>setSmsToAll(true)} /> <span className="text-sm">All PPPoE users ({pppoeUsers.length})</span></label>
              <label className="flex items-center gap-2"><input type="radio" checked={!smsToAll} onChange={()=>setSmsToAll(false)} /> <span className="text-sm">Custom numbers</span></label>
            </div>
            <div className="mt-3 border-t pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs">Location</label>
                  <button
                    type="button"
                    onClick={() => setSmsLocationModal(true)}
                    className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700 text-sm text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="truncate">{smsFilterLocation || 'Any'}</span>
                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div>
                  <label className="block text-xs">User Status</label>
                  <button
                    type="button"
                    onClick={() => setSmsUserStatusModal(true)}
                    className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700 text-sm text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="truncate">{smsFilterUserStatus || 'Any'}</span>
                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div>
                  <label className="block text-xs">Account Status</label>
                  <button
                    type="button"
                    onClick={() => setSmsAccountStatusModal(true)}
                    className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700 text-sm text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="truncate">{smsFilterAccountStatus || 'Any'}</span>
                    <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {!smsToAll && (
              <div className="mt-2">
                <label className="block text-xs text-slate-500">Enter comma-separated phone numbers</label>
                <input className="mt-1 w-full rounded border p-2 bg-white dark:bg-slate-700" value={smsList} onChange={e=>setSmsList(e.target.value)} placeholder="eg 0712345678,0798765432" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>{ setSmsOpen(false); setSmsMessage(''); setSmsList(''); setSmsToAll(true) }} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={async ()=>{
              const addToast = useStore.getState().addToast
              if(!smsMessage.trim()){ addToast('Enter a message', 'error'); return }
              let recipients = []
              if(smsToAll){
                recipients = pppoeUsers.filter(u=>{
                  if(smsFilterLocation && (u.location || '') !== smsFilterLocation) return false
                  if(smsFilterUserStatus && (u.status || '') !== smsFilterUserStatus) return false
                  if(smsFilterAccountStatus){
                    const isExpired = !!u.expiry && new Date(u.expiry) < new Date()
                    if(smsFilterAccountStatus === 'Expired' && !isExpired) return false
                    if(smsFilterAccountStatus === 'Active' && isExpired) return false
                  }
                  return true
                }).map(u=>u.phone).filter(Boolean)
              } else { recipients = smsList.split(',').map(s=>s.trim()).filter(Boolean) }
              if(recipients.length === 0){ addToast('No recipients found', 'error'); return }
              setSmsSending(true)
              // simulate network send
              await new Promise(r=>setTimeout(r, 600))
              setSmsSending(false)
              setSmsOpen(false)
              addToast(`SMS sent to ${recipients.length} recipient(s) (mock)`, 'success')
              setSmsMessage('')
              setSmsList('')
            }} className={`px-3 py-1 rounded bg-fastnet text-white ${smsSending? 'opacity-60 cursor-wait' : ''}`}>{smsSending? 'Sending...' : 'Send'}</button>
          </div>
        </div>
      </Modal>

      {/* Status Filter Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter by Status</h2>
          <div className="space-y-2">
            {[
              { value: '', label: 'All status', desc: 'Show all users' },
              { value: 'Active', label: 'Active', desc: 'Currently active users' },
              { value: 'Disabled', label: 'Disabled', desc: 'Disabled accounts' },
              { value: 'Suspended', label: 'Suspended', desc: 'Suspended accounts' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => selectStatus(status.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterStatus === status.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{status.label}</div>
                <div className="text-xs text-slate-500 mt-1">{status.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Package Filter Modal */}
      <Modal open={packageModal} onClose={() => setPackageModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter by Package</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => selectPackage('')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterPackage === '' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">All packages</div>
              <div className="text-xs text-slate-500 mt-1">Show all users</div>
            </button>
            {[...new Set(pppoeUsers.map(u=>u.package).filter(Boolean))].map(pkg => (
              <button
                key={pkg}
                onClick={() => selectPackage(pkg)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterPackage === pkg ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{pkg}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Location Filter Modal */}
      <Modal open={locationModal} onClose={() => setLocationModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter by Location</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => selectLocation('')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterLocation === '' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">All locations</div>
              <div className="text-xs text-slate-500 mt-1">Show all users</div>
            </button>
            {[...new Set(pppoeUsers.map(u=>u.location).filter(Boolean))].map(loc => (
              <button
                key={loc}
                onClick={() => selectLocation(loc)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${filterLocation === loc ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{loc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Form Package Selection Modal */}
      <Modal open={formPackageModal} onClose={() => setFormPackageModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Package</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => selectFormPackage('Monthly 7 Mbps')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${form.package === 'Monthly 7 Mbps' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">Monthly 7 Mbps</div>
            </button>
            {packages.map(p => (
              <button
                key={p.id}
                onClick={() => selectFormPackage(p.name)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${form.package === p.name ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Form Router Selection Modal */}
      <Modal open={formRouterModal} onClose={() => setFormRouterModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Assign Router</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => selectFormRouter('')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!form.routerId ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">-- none --</div>
              <div className="text-xs text-slate-500 mt-1">No router assigned</div>
            </button>
            {routerList.map(r => (
              <button
                key={r.id}
                onClick={() => selectFormRouter(r.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${form.routerId === r.id ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-500 mt-1">{r.ip}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* SMS Location Filter Modal */}
      <Modal open={smsLocationModal} onClose={() => setSmsLocationModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter SMS by Location</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <button
              onClick={() => selectSmsLocation('')}
              className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${smsFilterLocation === '' ? 'bg-fastnet/10 border-fastnet' : ''}`}
            >
              <div className="font-medium">Any</div>
              <div className="text-xs text-slate-500 mt-1">All locations</div>
            </button>
            {[...new Set(pppoeUsers.map(u=>u.location).filter(Boolean))].map(loc => (
              <button
                key={loc}
                onClick={() => selectSmsLocation(loc)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${smsFilterLocation === loc ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{loc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* SMS User Status Filter Modal */}
      <Modal open={smsUserStatusModal} onClose={() => setSmsUserStatusModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter SMS by User Status</h2>
          <div className="space-y-2">
            {[
              { value: '', label: 'Any', desc: 'All user statuses' },
              { value: 'Active', label: 'Active', desc: 'Active users only' },
              { value: 'Disabled', label: 'Disabled', desc: 'Disabled users only' },
              { value: 'Suspended', label: 'Suspended', desc: 'Suspended users only' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => selectSmsUserStatus(status.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${smsFilterUserStatus === status.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{status.label}</div>
                <div className="text-xs text-slate-500 mt-1">{status.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* SMS Account Status Filter Modal */}
      <Modal open={smsAccountStatusModal} onClose={() => setSmsAccountStatusModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Filter SMS by Account Status</h2>
          <div className="space-y-2">
            {[
              { value: '', label: 'Any', desc: 'All account statuses' },
              { value: 'Active', label: 'Active', desc: 'Non-expired accounts' },
              { value: 'Expired', label: 'Expired', desc: 'Expired accounts' }
            ].map(status => (
              <button
                key={status.value}
                onClick={() => selectSmsAccountStatus(status.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${smsFilterAccountStatus === status.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{status.label}</div>
                <div className="text-xs text-slate-500 mt-1">{status.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
