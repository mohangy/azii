import React, {useState, useEffect} from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import PopupButton from '../components/PopupButton'
import { fetchMock } from '../services/api'

export default function Users(){
  const [data, setData] = useState([])
  const [packages, setPackages] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    username:'', password:'', names:'', email:'', phone:'', location:'', coords:'', apartment:'', house:'', package:'', expiry:'', type:'PPPoE'
  })

  useEffect(()=>{
    let mounted = true
    Promise.all([fetchMock('mockUsers'), fetchMock('mockPackages')]).then(([u,p])=>{
      if(!mounted) return
      setData(u || [])
      setPackages(p || [])
    })
    return ()=> mounted = false
  },[])

  const location = useLocation()
  const atParent = location.pathname === '/users' || location.pathname === '/users/'

  const columns = [
    { key: 'username', title: 'Username', render: r => <Link className="text-blue-600" to={`/users/${r.username}`}>{r.username}</Link> },
    { key: 'type', title: 'Type' },
    { key: 'package', title: 'Package' },
    { key: 'status', title: 'Status' },
    { key: 'actions', title: 'Actions', render: (r)=> (
      <div className="flex items-center gap-2">
        <PopupButton className="px-2 py-1 border rounded" modalTitle={`Actions - ${r.username}`} modalContent={(close)=> (
          <div className="space-y-3">
            <button onClick={()=>{ setEditing(r); setForm({ username: r.username || '', password:'', names: r.names || '', email: r.email || '', phone: r.phone || '', location: r.location || '', coords: r.coords || '', apartment: r.apartment || '', house: r.house || '', package: r.package || '', expiry: r.expiry || '', type: r.type || 'PPPoE' }); close(); setOpen(true) }} className="w-full text-left px-3 py-2 rounded bg-slate-50">Edit</button>
            <button onClick={()=>{ setData(prev => prev.filter(p => p.username!==r.username)); close() }} className="w-full text-left px-3 py-2 rounded text-red-600">Delete</button>
            <button onClick={()=>close()} className="w-full text-left px-3 py-2 rounded border">Cancel</button>
          </div>
        )}>Actions</PopupButton>
      </div>
    )}
  ]

  const onSave = ()=>{
    const addToast = useStore.getState().addToast
    if(!form.username.trim() || !form.names.trim()){
      addToast('Please fill username and names', 'error')
      return
    }
    if(editing){
      setData(prev => prev.map(u => u.username === editing.username ? {...u, ...form} : u))
      // persist update
      try{
        const s = localStorage.getItem('fastnet:users')
        const arr = s ? JSON.parse(s) : []
        const idx = arr.findIndex(u=>u.username === editing.username)
        if(idx>=0) arr[idx] = {...arr[idx], ...form}
        localStorage.setItem('fastnet:users', JSON.stringify(arr))
      }catch(e){}
    } else {
      const newUser = {...form, status:'Active', createdAt: new Date().toISOString()}
      setData(prev => {
        const next = [newUser, ...prev]
        try{ const s = localStorage.getItem('fastnet:users'); const arr = s? JSON.parse(s): []; arr.unshift(newUser); localStorage.setItem('fastnet:users', JSON.stringify(arr)) }catch(e){}
        return next
      })
    }
    setOpen(false)
    setEditing(null)
    setForm({username:'', password:'', names:'', email:'', phone:'', location:'', coords:'', apartment:'', house:'', package:'', expiry:'', type:'PPPoE'})
  }

  if(!atParent) return <Outlet />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <div>
          <button onClick={()=>{setEditing(null); setForm({username:'', password:'', names:'', email:'', phone:'', location:'', coords:'', apartment:'', house:'', package:'', expiry:'', type:'PPPoE'}); setOpen(true)}} className="px-3 py-1 bg-fastnet text-white rounded">Add User</button>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={data} />
      </Card>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing? 'Edit User' : 'Add User'}>
        <form className="space-y-3">
          <div>
            <label className="block text-sm">PPPoE Username*</label>
            <input className="w-full p-2 border rounded" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm">PPPoE Password*</label>
            <input className="w-full p-2 border rounded" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm">Names* (e.g john doe)</label>
            <input className="w-full p-2 border rounded" value={form.names} onChange={e=>setForm(f=>({...f, names:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Email (optional)</label>
              <input className="w-full p-2 border rounded" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Phone</label>
              <input className="w-full p-2 border rounded" value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Location (optional)</label>
              <input className="w-full p-2 border rounded" value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">Coordinates (optional)</label>
              <input placeholder="-3.5000,35.4000" className="w-full p-2 border rounded" value={form.coords} onChange={e=>setForm(f=>({...f, coords:e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Apartment Number (optional)</label>
              <input className="w-full p-2 border rounded" value={form.apartment} onChange={e=>setForm(f=>({...f, apartment:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm">House Number (optional)</label>
              <input className="w-full p-2 border rounded" value={form.house} onChange={e=>setForm(f=>({...f, house:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm">Select Package*</label>
            <select className="w-full p-2 border rounded" value={form.package} onChange={e=>setForm(f=>({...f, package:e.target.value}))}>
              <option value="">-- choose --</option>
              {packages.map(p=> <option key={p.id} value={p.name}>{p.name} ({p.speed})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Select Expiry Date</label>
            <input type="date" className="w-full p-2 border rounded" value={form.expiry} onChange={e=>setForm(f=>({...f, expiry:e.target.value}))} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>{setOpen(false); setEditing(null)}} className="px-3 py-1 border rounded">Cancel</button>
            <button type="button" onClick={onSave} className="px-3 py-1 bg-fastnet text-white rounded">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
