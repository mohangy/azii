import React from 'react'
import PopupButton from '../components/PopupButton'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Modal from '../components/Modal'
import { fetchMock } from '../services/api'

export default function UserDetail(){
  const { username } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  // action modals
  const [rechargeOpen, setRechargeOpen] = React.useState(false)
  const [smsOpen, setSmsOpen] = React.useState(false)
  const [planOpen, setPlanOpen] = React.useState(false)
  const [overrideOpen, setOverrideOpen] = React.useState(false)
  const [childOpen, setChildOpen] = React.useState(false)
  const [extendOpen, setExtendOpen] = React.useState(false)
  const [updateOpen, setUpdateOpen] = React.useState(false)

  // receipts, routers and connection state must be declared before effects that use them
  const [receipts, setReceipts] = React.useState([])
  const [routers, setRouters] = React.useState([])
  const [pingMs, setPingMs] = React.useState(null)
  const [lastSeen, setLastSeen] = React.useState(null)
  const [connStatus, setConnStatus] = React.useState(null)
  const [rechargeAmount, setRechargeAmount] = React.useState('')
  const [rechargeRef, setRechargeRef] = React.useState('')
  const [rechargeDesc, setRechargeDesc] = React.useState('')
  const [actionsOpen, setActionsOpen] = React.useState(false)
  const [mobileActionsOpen, setMobileActionsOpen] = React.useState(false)
  const actionsRef = React.useRef(null)
  const actionsButtonRef = React.useRef(null)
  const actionsItemsRef = React.useRef([])
  const [actionsFocusIndex, setActionsFocusIndex] = React.useState(-1)
  const [logs, setLogs] = React.useState([])
  const [resolveOpen, setResolveOpen] = React.useState(false)
  const [resolveRef, setResolveRef] = React.useState('')
  const [resolveTx, setResolveTx] = React.useState(null)
  const [resolveLoading, setResolveLoading] = React.useState(false)

  React.useEffect(()=>{
    let mounted = true
    Promise.all([fetchMock('mockUsers'), fetchMock('mockTransactions'), fetchMock('mockRouters')]).then(([u,tx,routers])=>{
      if(!mounted) return
      const stored = (()=>{
        try{ const s = localStorage.getItem('fastnet:users'); return s ? JSON.parse(s) : [] }catch(e){return []}
      })()
      const all = [...(stored || []), ...(u||[])]
      const found = all.find(x => x.username === username)
      setUser(found || null)
      // receipts
      const receipts = (tx||[]).filter(t=>t.user === username)
      setReceipts(receipts)
      setRouters(routers || [])
      setLoading(false)
    })
    return ()=> mounted = false
  },[username])

  // when user or routers change, initialize ping info
  React.useEffect(()=>{
    if(!user) return
    if(user.routerId){
      const r = routers.find(x=>String(x.id) === String(user.routerId))
      simulatePing(r)
    } else {
      setPingMs(null); setLastSeen(null); setConnStatus('No router assigned')
    }
  },[user, routers])

  // update relative last-seen display every 30s (keeps timestamp fresh)
  React.useEffect(()=>{
    const iv = setInterval(()=> setLastSeen(ls => ls ? new Date(ls) : ls), 30000)
    return ()=> clearInterval(iv)
  },[])

  // Close the actions dropdown when clicking outside or pressing Escape
  React.useEffect(()=>{
    function handleOutside(e){
      if(!actionsOpen) return
      const menu = actionsRef.current
      const btn = actionsButtonRef.current
      const target = e.target
      if(menu && !menu.contains(target) && btn && !btn.contains(target)){
        setActionsOpen(false)
      }
    }
    function handleKey(e){
      if(e.key === 'Escape') { setActionsOpen(false); return }
      // if menu is open, handle navigation
      if(!actionsOpen) return
      const items = actionsItemsRef.current || []
      if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){
        e.preventDefault()
        if(e.key === 'ArrowDown'){
          setActionsFocusIndex(i => Math.min(items.length - 1, (i + 1) || 0))
        } else if(e.key === 'ArrowUp'){
          setActionsFocusIndex(i => Math.max(0, (i === -1 ? items.length : i) - 1))
        } else if(e.key === 'Home'){
          setActionsFocusIndex(0)
        } else if(e.key === 'End'){
          setActionsFocusIndex(items.length - 1)
        } else if(e.key === 'Enter' || e.key === ' '){
          // activate focused item
          const idx = actionsFocusIndex
          if(idx >= 0 && items[idx]){ items[idx].click() }
        }
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleKey)
    return ()=>{
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  },[actionsOpen])

  // When focus index changes, focus the corresponding item
  React.useEffect(()=>{
    if(actionsFocusIndex >= 0){
      const el = (actionsItemsRef.current || [])[actionsFocusIndex]
      if(el && typeof el.focus === 'function') el.focus()
    }
  },[actionsFocusIndex])

  const formatRelative = (d)=>{
    if(!d) return '-'
    const ms = Date.now() - new Date(d).getTime()
    const s = Math.floor(ms/1000)
    if(s < 60) return `${s}s ago`
    const m = Math.floor(s/60)
    if(m < 60) return `${m}m ago`
    const h = Math.floor(m/60)
    if(h < 24) return `${h}h ago`
    const days = Math.floor(h/24)
    return `${days}d ago`
  }

  const simulatePing = (router)=>{
    const base = (username + (router?.id ?? '')).split('').reduce((s,c)=> s + c.charCodeAt(0), 0)
    const rand = (n)=> Math.abs((Math.sin(base + n) * 10000)) % 1
    const latency = Math.floor(20 + rand(1) * 600) // 20-620ms
    const now = Date.now()
    const last = new Date(now - Math.floor(rand(2) * 1000 * 60 * 60)) // within last hour
    const status = latency < 400 ? 'Online' : (latency < 1000 ? 'Degraded' : 'Offline')
    setPingMs(latency)
    setLastSeen(last)
    setConnStatus(status)
    // append a connection log entry
    setLogs(prev => [{ ts: new Date().toISOString(), ping: latency, status, ip: router?.ip || user?.ip || '-', note: 'Ping' }, ...prev].slice(0,50))
  }

  const doDelete = ()=>{
    const addToast = useStore.getState().addToast
    // perform deletion (caller should confirm)
    // local deletion only: store in localStorage as removed marker
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      const filtered = arr.filter(u=>u.username !== username)
      localStorage.setItem('fastnet:users', JSON.stringify(filtered))
    }catch(e){/* ignore */}
  addToast('User deleted (local only)', 'success')
    navigate('/users')
  }

  const doResetMac = ()=>{
  const addToast = useStore.getState().addToast
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      const idx = arr.findIndex(u=>u.username === username)
      if(idx>=0){ arr[idx] = {...arr[idx], lastMac: null, lastIp: null }; localStorage.setItem('fastnet:users', JSON.stringify(arr)) }
  setUser(u=> ({...u, lastMac: null, lastIp: null}))
  addToast('MAC/IP cleared (local)', 'success')
  }catch(e){ console.error(e); addToast('Failed to reset', 'error') }
  }

  const onAddChild = (child)=>{
    // child is { username, names }
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      const idx = arr.findIndex(u=>u.username === username)
      const updated = {...(arr[idx] || user), children: [...((arr[idx]||user).children||[]), child]}
      if(idx>=0) arr[idx] = updated
      else arr.unshift(updated)
      localStorage.setItem('fastnet:users', JSON.stringify(arr))
  setUser(updated)
  addToast('Child account added (local)', 'success')
  }catch(e){ console.error(e); addToast('Failed to add child', 'error') }
  }

  const onResolvePayment = (ref)=>{
    // mark transaction resolved locally by updating fastnet:transactions
    try{
      const s = localStorage.getItem('fastnet:transactions')
      const arr = s ? JSON.parse(s) : []
      const idx = arr.findIndex(t=>t.ref === ref)
      if(idx>=0){ arr[idx] = {...arr[idx], status: 'Resolved'}; localStorage.setItem('fastnet:transactions', JSON.stringify(arr)); setReceipts(prev => prev.map(r=> r.ref===ref ? {...r, status: 'Resolved'} : r)) }
  addToast('Payment marked resolved (local)', 'success')
  }catch(e){ console.error(e); addToast('Failed to resolve payment', 'error') }
  }

  const onExtendExpiry = (newDate)=>{
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      const idx = arr.findIndex(u=>u.username === username)
      if(idx>=0){ arr[idx] = {...arr[idx], expiry: newDate}; localStorage.setItem('fastnet:users', JSON.stringify(arr)) }
      setUser(u=> ({...u, expiry: newDate}))
  addToast('Expiry extended (local)', 'success')
  }catch(e){ console.error(e); addToast('Failed to extend', 'error') }
  }

  const onSaveOverride = (bandwidth)=>{
    // bandwidth in Mbps
    const bwNum = Number(bandwidth)
  const addToast = useStore.getState().addToast
  if(!bwNum || isNaN(bwNum) || bwNum <= 0){ addToast('Enter a valid bandwidth in Mbps', 'error'); return }
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      const idx = arr.findIndex(u=>u.username === username)
      if(idx >= 0){ arr[idx] = {...arr[idx], overrideBandwidth: bwNum}; localStorage.setItem('fastnet:users', JSON.stringify(arr)) }
      else { arr.unshift({...user, overrideBandwidth: bwNum}); localStorage.setItem('fastnet:users', JSON.stringify(arr)) }
      setUser(u => ({...u, overrideBandwidth: bwNum}))
  addToast(`Override applied: ${bwNum} Mbps (local only)`, 'success')
  }catch(e){ console.error('failed to save override', e); addToast('Failed to apply override', 'error') }
  }

  const onSaveUpdate = (updated)=>{
    try{
      const s = localStorage.getItem('fastnet:users')
      const arr = s ? JSON.parse(s) : []
      // normalize coords in the incoming update to 'lat,lon' with fixed decimals
      if(updated && updated.coords){
        try{
          const parts = String(updated.coords).split(',').map(s=>s.trim())
          if(parts.length >= 2){
            const lat = parseFloat(parts[0]); const lon = parseFloat(parts[1])
            if(!isNaN(lat) && !isNaN(lon)){
              updated.coords = `${lat.toFixed(6)},${lon.toFixed(6)}`
            }
          }
        }catch(e){ /* ignore malformed coords */ }
      }

      // replace or add
      const idx = arr.findIndex(u=>u.username===username)
      if(idx>=0) arr[idx] = {...arr[idx], ...updated}
      else arr.unshift({...user, ...updated})
      localStorage.setItem('fastnet:users', JSON.stringify(arr))
      setUser(u=> ({...u, ...updated}))
  addToast('User updated (local)', 'success')
  }catch(e){ addToast('Failed to save', 'error') }
  }

  if(loading) return <div>Loading...</div>
  if(!user) return <Card><div>User not found: {username}</div></Card>

  return (
    <div className="space-y-4">
      {/* Username on top, actions below in a stacked layout */}
      <div className="flex flex-col items-start gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{user.username}</h2>
          <div className="text-sm text-slate-500">{user.names || ''} • {user.email || ''}</div>
        </div>
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{user.status}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={()=>setRechargeOpen(true)} className="w-full sm:w-auto px-3 py-1 bg-fastnet text-white rounded">Manual Recharge</button>
            <button onClick={()=>setSmsOpen(true)} className="w-full sm:w-auto px-3 py-1 border rounded">SMS</button>
            <button onClick={()=>setPlanOpen(true)} className="w-full sm:w-auto px-3 py-1 border rounded">Change Plan</button>
            {/* Actions dropdown moved here */}
            <div className="relative">
              <PopupButton className="ml-2 sm:ml-2 w-36 px-3 py-1 border rounded inline-flex items-center justify-between text-center gap-2" modalTitle={`Actions - ${username}`} modalContent={(close)=> (
                <div className="space-y-3">
                  <div className="text-sm text-center">Choose an action</div>
                  <div className="flex flex-col gap-2">
                    <PopupButton className="w-full text-center px-3 py-2 rounded bg-slate-50" modalTitle={`Suspend ${username}?`} modalBody={`Suspend user ${username}?`} onConfirm={async ()=>{ useStore.getState().addToast('User suspended (local only)', 'success') }} confirmLabel="Suspend">Suspend user</PopupButton>
                    <PopupButton className="w-full text-center px-3 py-2 rounded bg-slate-50" modalTitle={`Activate ${username}?`} modalBody={`Activate user ${username}?`} onConfirm={async ()=>{ useStore.getState().addToast('User activated (local only)', 'success') }} confirmLabel="Activate">Activate user</PopupButton>
                    <PopupButton className="w-full text-center px-3 py-2 rounded bg-slate-50" modalTitle={`Reset MAC/IP - ${username}`} modalBody={`Reset last known MAC/IP for ${username}?`} onConfirm={async ()=>{ doResetMac(); }} confirmLabel="Reset">Reset MAC/IP</PopupButton>
                    <button onClick={()=>{ setChildOpen(true); close() }} className="w-full text-center px-3 py-2 rounded bg-slate-50">Add Child Account</button>
                    <button onClick={()=>{ setExtendOpen(true); close() }} className="w-full text-center px-3 py-2 rounded bg-slate-50">Extend Expiry</button>
                    <button onClick={()=>{ setOverrideOpen(true); close() }} className="w-full text-center px-3 py-2 rounded bg-slate-50">Override plan</button>
                    <button onClick={()=>{ setResolveOpen(true); close() }} className="w-full text-center px-3 py-2 rounded bg-slate-50">Resolve payment</button>
                    <button onClick={()=>{ setUpdateOpen(true); close() }} className="w-full text-center px-3 py-2 rounded bg-slate-50">Update info</button>
                    <PopupButton className="w-full text-center px-3 py-2 rounded bg-red-50 text-red-700" modalTitle={`Delete ${username}?`} modalContent={(close)=> (
                      <div className="space-y-3">
                        <div className="text-sm">Are you sure you want to delete <strong>{username}</strong>? This action cannot be undone.</div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={()=>close()} className="px-3 py-1 border rounded">Cancel</button>
                          <button onClick={()=>{ doDelete(); close() }} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                        </div>
                      </div>
                    )}>Delete user</PopupButton>
                    <button onClick={()=>{ close() }} className="w-full text-center px-3 py-2 rounded border">Cancel</button>
                  </div>
                </div>
              )}>Actions <span className="text-sm">▾</span></PopupButton>
            </div>
          </div>
        </div>
      </div>

      {/* Flexible responsive grid: 1 col (default), 2 cols on small screens, 4 cols on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account Details should be largest: span 2 columns on lg */}
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <h3 className="font-semibold mb-2">Account Details</h3>
            <div className="text-sm space-y-1">
              <div><strong>Client Full Name:</strong> {user.names || '-'}</div>
              <hr className="my-1" />
              <div><strong>Account Type:</strong> {user.type || '-'}</div>
              <div><strong>Router:</strong> {user.routerId ? (routers.find(r=>String(r.id)===String(user.routerId))?.name || user.routerId) : '-'}</div>
              <div><strong>IP Address:</strong> {user.ip || '-'}</div>
              <div className="flex items-center gap-3"><strong>Connection status:</strong>
                {connStatus === 'Online' ? (
                  <span className="px-2 py-0.5 rounded text-sm bg-green-100 text-green-800">Online</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-sm bg-red-100 text-red-800">Offline</span>
                )}
                <button onClick={()=>{ const r = routers.find(r=>String(r.id)===String(user.routerId)); simulatePing(r) }} className="px-2 py-1 border rounded text-sm">Ping</button>
              </div>
              <div><strong>Ping:</strong> {pingMs ? `${pingMs} ms` : '-'}</div>
              <div><strong>Last seen:</strong> {formatRelative(lastSeen)}</div>
              <div><strong>Account Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</div>
              <div><strong>Expiry Date:</strong> {user.expiry || '-'}</div>
              <div><strong>Package:</strong> {user.package || '-'}</div>
            </div>
          </Card>
        </div>

        <div className="col-span-1">
          <Card>
            <h3 className="font-semibold mb-2">Current Plan</h3>
            <div className="text-sm space-y-2">
              <div><strong>Plan:</strong> {user.package || '-'}</div>
              <div>
                <strong>Monthly Usage</strong>
                <div className="text-xs text-slate-500">{(user.usage && user.usage.monthly) ? `${user.usage.monthly.used ?? 0} GB / ${user.usage.monthly.total ?? 0} GB` : '- / -'}</div>
              </div>
              <div><strong>Expiry Date:</strong> {user.expiry || '-'}</div>
            </div>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="h-full">
            <h3 className="font-semibold mb-2">Connection logs</h3>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-500">Recent connection events and pings</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{ const r = routers.find(x=>String(x.id)===String(user.routerId)); simulatePing(r) }} className="px-2 py-1 border rounded text-sm">Refresh</button>
                <button onClick={()=>{ setLogs([]); useStore.getState().addToast('Cleared logs (local)', 'success') }} className="px-2 py-1 border rounded text-sm">Clear</button>
              </div>
            </div>
            <div className="text-sm space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-500">No logs yet. Press Refresh to generate a ping.</div>
              ) : (
                logs.map((l, idx) => (
                  <div key={idx} className="border p-2 rounded">
                    <div className="text-xs text-slate-500">{new Date(l.ts).toLocaleString()}</div>
                    <div><strong>{l.note}</strong> — {l.ping} ms • {l.status} • IP: {l.ip}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions card: useful shortcuts for the admin */}
        <div className="col-span-1">
          <Card className="h-full">
            <h3 className="font-semibold mb-2">Client Location</h3>
            <div className="text-sm">
              {user.coords ? (
                (()=>{
                  // coords expected as 'lat,lon'
                  const parts = String(user.coords).split(',').map(s=>s.trim())
                  const lat = parseFloat(parts[0])
                  const lon = parseFloat(parts[1])
                  if(isNaN(lat) || isNaN(lon)) return <div>Invalid coordinates: {user.coords}</div>
                  const delta = 0.01
                  const left = (lon - delta).toFixed(6)
                  const right = (lon + delta).toFixed(6)
                  const bottom = (lat - delta).toFixed(6)
                  const top = (lat + delta).toFixed(6)
                  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`
                  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
                  return (
                    <div className="space-y-2">
                      <div className="w-full h-56 overflow-hidden rounded">
                        <iframe title="client-location" src={src} style={{border:0,width:'100%',height:'100%'}} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">Coordinates: {lat.toFixed(6)},{lon.toFixed(6)}</div>
                        <a className="text-sm text-blue-600" href={link} target="_blank" rel="noreferrer">View on OpenStreetMap</a>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="space-y-2">
                  <div className="text-slate-500">No location available for this client.</div>
                  <div className="flex gap-2">
                    <button onClick={()=>setUpdateOpen(true)} className="px-3 py-1 bg-fastnet text-white rounded">Add location</button>
                    <button onClick={()=>{ navigator.clipboard?.writeText(user?.ip || '') ; useStore.getState().addToast('IP copied to clipboard', 'success') }} className="px-3 py-1 border rounded">Copy IP</button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold mb-2">Receipts</h3>
        <div className="text-sm space-y-2">
          {receipts.length === 0 ? <div>No receipts found</div> : receipts.map(r=> (
            <div key={r.ref} className="border p-2 rounded flex items-center justify-between">
              <div>
                <div><strong>Ref:</strong> {r.ref}</div>
                <div><strong>Amount:</strong> {r.amount}</div>
                <div><strong>Status:</strong> {r.status}</div>
                <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2">
                {r.status !== 'Resolved' && <button onClick={()=> onResolvePayment(r.ref)} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Resolve</button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modals */}
      <Modal open={rechargeOpen} onClose={()=>{ setRechargeRef(''); setRechargeDesc(''); setRechargeAmount(''); setRechargeOpen(false) }} title={`Manual Recharge - ${username}`}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Your Ref</label>
            <input value={rechargeRef} onChange={e=>setRechargeRef(e.target.value)} placeholder="e.g. M-Pesa Ref 12345" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">Description</label>
            <textarea value={rechargeDesc} onChange={e=>setRechargeDesc(e.target.value)} placeholder="Optional description" className="w-full p-2 border rounded" rows={3} />
          </div>
          <div>
            <label className="block text-sm">Amount</label>
            <input value={rechargeAmount} onChange={e=>setRechargeAmount(e.target.value)} placeholder="e.g. 1000" className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>{ setRechargeRef(''); setRechargeDesc(''); setRechargeAmount(''); setRechargeOpen(false) }} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={()=>{
              const amt = Number(rechargeAmount)
              const addToast = useStore.getState().addToast
              if(!rechargeRef || !rechargeRef.trim()){ addToast('Enter your reference (your ref)', 'error'); return }
              if(!amt || isNaN(amt) || amt <= 0){ addToast('Enter a valid amount', 'error'); return }
              const tx = { ref: rechargeRef.trim(), user: username, amount: amt, description: rechargeDesc.trim() || '', status: 'Success', createdAt: new Date().toISOString() }
              try{
                const s = localStorage.getItem('fastnet:transactions')
                const arr = s ? JSON.parse(s) : []
                arr.unshift(tx)
                localStorage.setItem('fastnet:transactions', JSON.stringify(arr))
              }catch(e){ console.error('Failed to save transaction', e) }
              // also update receipts in this view
              setReceipts(r => [tx, ...(r||[])])
              setRechargeRef('')
              setRechargeDesc('')
              setRechargeAmount('')
              setRechargeOpen(false)
              useStore.getState().addToast('Recharged (mock) and receipt saved locally', 'success')
            }} className="px-3 py-1 bg-fastnet text-white rounded">Recharge</button>
          </div>
        </div>
      </Modal>

      <Modal open={resolveOpen} onClose={()=>{ setResolveOpen(false); setResolveRef(''); setResolveTx(null); setResolveLoading(false) }} title={`Resolve Payment - ${username}`}>
        <ResolvePaymentForm refValue={resolveRef} onChangeRef={setResolveRef} tx={resolveTx} loading={resolveLoading} onLookup={async (ref)=>{
          setResolveLoading(true)
          // lookup in localStorage first, then mock transactions
          let found = null
          try{
            const s = localStorage.getItem('fastnet:transactions')
            const arr = s ? JSON.parse(s) : []
            found = arr.find(t=>t.ref === ref)
          }catch(e){ found = null }
          if(!found){
            const mock = await fetchMock('mockTransactions')
            found = (mock || []).find(t=>t.ref === ref)
          }
          setResolveTx(found || null)
          setResolveLoading(false)
        }} onResolve={(ref)=>{
          if(!ref) return
          // reassign transaction to current user and mark Resolved
          try{
            const s = localStorage.getItem('fastnet:transactions')
            const arr = s ? JSON.parse(s) : []
            const idx = arr.findIndex(t=>t.ref === ref)
            const now = new Date().toISOString()
            if(idx>=0){ arr[idx] = {...arr[idx], user: username, status: 'Resolved', resolvedAt: now }; localStorage.setItem('fastnet:transactions', JSON.stringify(arr)) }
            else { // not in local, add a new resolved transaction
              arr.unshift({ ref, user: username, amount: resolveTx?.amount || 0, description: resolveTx?.description || 'Resolved manually', status: 'Resolved', createdAt: now, resolvedAt: now })
              localStorage.setItem('fastnet:transactions', JSON.stringify(arr))
            }
            // update receipts shown
            setReceipts(r => [{ ref, user: username, amount: resolveTx?.amount || 0, description: resolveTx?.description || '', status: 'Resolved', createdAt: resolveTx?.createdAt || new Date().toISOString() }, ...(r||[])])
            useStore.getState().addToast('Payment reassigned and marked resolved (local only)', 'success')
            setResolveOpen(false)
            setResolveRef('')
            setResolveTx(null)
          }catch(e){ console.error(e); alert('Failed to resolve') }
        }} />
      </Modal>

      <Modal open={childOpen} onClose={()=>setChildOpen(false)} title={`Add Child Account - ${username}`}>
        <ChildAccountForm onCancel={()=>setChildOpen(false)} onSave={(c)=>{ onAddChild(c); setChildOpen(false) }} />
      </Modal>

      <Modal open={extendOpen} onClose={()=>setExtendOpen(false)} title={`Extend Expiry - ${username}`}>
        <ExtendExpiryForm initial={user?.expiry} onCancel={()=>setExtendOpen(false)} onSave={(d)=>{ onExtendExpiry(d); setExtendOpen(false) }} />
      </Modal>

      <Modal open={smsOpen} onClose={()=>setSmsOpen(false)} title={`Send SMS - ${username}`}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Message</label>
            <textarea className="w-full p-2 border rounded" rows={4} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setSmsOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={()=>{ alert('SMS sent (mock)'); setSmsOpen(false)}} className="px-3 py-1 bg-fastnet text-white rounded">Send</button>
          </div>
        </div>
      </Modal>

      <Modal open={planOpen} onClose={()=>setPlanOpen(false)} title={`Change Plan - ${username}`}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Select Plan</label>
            <select className="w-full p-2 border rounded">
              <option>Basic</option>
              <option>Pro</option>
              <option>Unlimited</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setPlanOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={()=>{ alert('Plan changed (mock)'); setPlanOpen(false)}} className="px-3 py-1 bg-fastnet text-white rounded">Change</button>
          </div>
        </div>
      </Modal>

        <Modal open={overrideOpen} onClose={()=>setOverrideOpen(false)} title={`Override Bandwidth - ${username}`}>
          <OverrideForm onCancel={()=>setOverrideOpen(false)} initial={user?.overrideBandwidth} onSave={(bw)=>{ onSaveOverride(bw); setOverrideOpen(false) }} />
        </Modal>

      <Modal open={updateOpen} onClose={()=>setUpdateOpen(false)} title={`Update Info - ${username}`}>
        <UpdateForm initial={user} onCancel={()=>setUpdateOpen(false)} onSave={(upd)=>{ onSaveUpdate(upd); setUpdateOpen(false) }} />
      </Modal>
    </div>
  )
}

function UpdateForm({initial, onCancel, onSave}){
  const [state, setState] = React.useState({
    account: initial.account || '',
    names: initial.names||'',
    password: initial.password || '',
    ip: initial.ip || '',
    email: initial.email || '',
    phone: initial.phone || '',
    location: initial.location || ''
  })

  const doSave = ()=>{
    // required fields: Names, Password, Phone
    if(!state.names.trim() || !state.password.trim() || !state.phone.trim()){
      alert('Please fill required fields: Client Names, PPPoE Password and Phone')
      return
    }
    // basic email validation if provided
    if(state.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)){
      alert('Enter a valid email address')
      return
    }
    const payload = {
      account: state.account || undefined,
      names: state.names,
      password: state.password,
      ip: state.ip || undefined,
      email: state.email || undefined,
      phone: state.phone,
      location: state.location || undefined
    }
    onSave(payload)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">Account Number</label>
        <input className="w-full p-2 border rounded" value={state.account} onChange={e=>setState(s=>({...s, account: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">Client Names *</label>
        <input className="w-full p-2 border rounded" value={state.names} onChange={e=>setState(s=>({...s, names: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">PPPoE Password *</label>
        <input className="w-full p-2 border rounded" value={state.password} onChange={e=>setState(s=>({...s, password: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">IP Address</label>
        <input className="w-full p-2 border rounded" value={state.ip} onChange={e=>setState(s=>({...s, ip: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input className="w-full p-2 border rounded" value={state.email} onChange={e=>setState(s=>({...s, email: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">Phone *</label>
        <input className="w-full p-2 border rounded" value={state.phone} onChange={e=>setState(s=>({...s, phone: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">Location</label>
        <input className="w-full p-2 border rounded" value={state.location} onChange={e=>setState(s=>({...s, location: e.target.value}))} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={doSave} className="px-3 py-1 bg-fastnet text-white rounded">Save</button>
      </div>
    </div>
  )
}

function OverrideForm({initial, onCancel, onSave}){
  const [bw, setBw] = React.useState(initial ? String(initial) : '')
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">Custom Bandwidth (Mbps)</label>
        <input className="w-full p-2 border rounded" placeholder="e.g. 50" value={bw} onChange={e=>setBw(e.target.value)} />
        <div className="text-xs text-slate-500 mt-1">This will override the user's package speed locally.</div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={()=>onSave(bw)} className="px-3 py-1 bg-fastnet text-white rounded">Apply</button>
      </div>
    </div>
  )
}

function ChildAccountForm({onCancel, onSave}){
  const [state, setState] = React.useState({username:'', names:''})
  const doSave = ()=>{
    if(!state.username.trim() || !state.names.trim()){ alert('Provide username and names for child'); return }
    onSave({ username: state.username.trim(), names: state.names.trim(), createdAt: new Date().toISOString(), type: 'Child' })
  }
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">Child Username</label>
        <input className="w-full p-2 border rounded" value={state.username} onChange={e=>setState(s=>({...s, username: e.target.value}))} />
      </div>
      <div>
        <label className="block text-sm">Client Names</label>
        <input className="w-full p-2 border rounded" value={state.names} onChange={e=>setState(s=>({...s, names: e.target.value}))} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={doSave} className="px-3 py-1 bg-fastnet text-white rounded">Add</button>
      </div>
    </div>
  )
}

function ExtendExpiryForm({initial, onCancel, onSave}){
  const [date, setDate] = React.useState(initial ? initial.split('T')[0] : '')
  const doSave = ()=>{
    if(!date) { alert('Pick a date'); return }
    onSave(date)
  }
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">New Expiry Date</label>
        <input type="date" className="w-full p-2 border rounded" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={doSave} className="px-3 py-1 bg-fastnet text-white rounded">Extend</button>
      </div>
    </div>
  )
}

function ResolvePaymentForm({refValue, onChangeRef, tx, loading, onLookup, onResolve}){
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">Search Payment by Reference</label>
        <div className="flex gap-2 mt-1">
          <input className="flex-1 p-2 border rounded" value={refValue} onChange={e=>onChangeRef(e.target.value)} placeholder="Enter payment ref" />
          <button onClick={()=>onLookup(refValue)} className="px-3 py-2 bg-slate-100 rounded">Lookup</button>
        </div>
      </div>
      <div>
        {loading ? <div>Looking up...</div> : (
          tx ? (
            <div className="border p-2 rounded">
              <div><strong>Ref:</strong> {tx.ref}</div>
              <div><strong>Amount:</strong> {tx.amount}</div>
              <div><strong>Description:</strong> {tx.description || '-'}</div>
              <div><strong>Current User:</strong> {tx.user || '-'}</div>
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={()=>onResolve(tx.ref)} className="px-3 py-1 bg-fastnet text-white rounded">Reassign to { /* current user in parent closure */ } user</button>
              </div>
            </div>
          ) : <div className="text-slate-500">No transaction found for this ref</div>
        )}
      </div>
    </div>
  )
}
