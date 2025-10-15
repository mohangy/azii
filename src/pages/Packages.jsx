import React from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import PopupButton from '../components/PopupButton'
import mockPackages from '../data/mockPackages.json'
import { fetchMock } from '../services/api'

export default function Packages(){
  const [chooserPackage, setChooserPackage] = React.useState(null)
  const [packages, setPackages] = React.useState([])
  const [routers, setRouters] = React.useState([])
  const [form, setForm] = React.useState({
    name:'', serviceType:'PPPoE', amount:'', bandwidth:'', rx_tx_rate:'', rx_tx_burst:'', rx_tx_burst_threshold:'', rx_tx_burst_time:'', hotspotSessionTimeValue:'', hotspotSessionTimeUnit:'minutes', hotspotDataLimit:'', hotspotDataUnit:'MB', routers: []
  })
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [actionOpenId, setActionOpenId] = React.useState(null)

  // close action menu when clicking outside (anywhere not on the action button or menu)
  React.useEffect(()=>{
    function onDoc(e){
      const el = e.target
      if(el && (el.closest('[data-action-menu]') || el.closest('[data-action-button]'))){
        return
      }
      setActionOpenId(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return ()=>{ document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc) }
  },[])

  React.useEffect(()=>{
    let mounted = true
    fetchMock('mockRouters').then(r=>{ if(mounted) setRouters(r || []) })
    // load persisted packages or fallback to mock data
    try{
      const s = localStorage.getItem('fastnet:packages')
      if(s){ setPackages(JSON.parse(s)) }
      else { setPackages(mockPackages || []) }
    }catch(e){ setPackages(mockPackages || []) }
    return ()=> mounted = false
  },[])

  const save = ()=>{
    // basic validation
    if(!form.name.trim() || !form.serviceType || !form.amount){ alert('Please fill required fields: Package Name, Service Type and Amount'); return }
    const pkg = {
      id: Date.now(),
      name: form.name.trim(),
      serviceType: form.serviceType,
      amount: Number(form.amount) || 0,
      bandwidth: form.bandwidth,
      rx_tx_rate: form.rx_tx_rate,
      rx_tx_burst: form.rx_tx_burst,
      rx_tx_burst_threshold: form.rx_tx_burst_threshold,
      rx_tx_burst_time: form.rx_tx_burst_time,
      hotspotSessionTime: form.hotspotSessionTimeValue ? `${form.hotspotSessionTimeValue} ${form.hotspotSessionTimeUnit}` : null,
      hotspotDataLimit: form.hotspotDataLimit ? `${form.hotspotDataLimit} ${form.hotspotDataUnit}` : null,
      routers: form.routers || []
    }
    const next = [pkg, ...packages]
    setPackages(next)
    try{ localStorage.setItem('fastnet:packages', JSON.stringify(next)) }catch(e){ console.error('Failed to persist packages', e) }
    setOpen(false)
    // reset form
    setForm({name:'', serviceType:'PPPoE', amount:'', bandwidth:'', rx_tx_rate:'', rx_tx_burst:'', rx_tx_burst_threshold:'', rx_tx_burst_time:'', hotspotSessionTimeValue:'', hotspotSessionTimeUnit:'minutes', hotspotDataLimit:'', hotspotDataUnit:'MB', routers: []})
  }

  const startEdit = (p)=>{
    // if called from chooser flow, ensure editing modal opens
    setEditing(p)
    setForm({
      name: p.name || '',
      serviceType: p.serviceType || 'PPPoE',
      amount: p.amount || '',
      bandwidth: p.bandwidth || '',
      rx_tx_rate: p.rx_tx_rate || '',
      rx_tx_burst: p.rx_tx_burst || '',
      rx_tx_burst_threshold: p.rx_tx_burst_threshold || '',
      rx_tx_burst_time: p.rx_tx_burst_time || '',
      hotspotSessionTimeValue: p.hotspotSessionTime ? String(p.hotspotSessionTime).split(' ')[0] : '',
      hotspotSessionTimeUnit: p.hotspotSessionTime ? String(p.hotspotSessionTime).split(' ')[1] : 'minutes',
      hotspotDataLimit: p.hotspotDataLimit ? String(p.hotspotDataLimit).split(' ')[0] : '',
      hotspotDataUnit: p.hotspotDataLimit ? String(p.hotspotDataLimit).split(' ')[1] : 'MB',
      routers: p.routers || []
    })
    setEditOpen(true)
  }

  // When a package card is clicked, open chooser modal instead of direct edit
  const onCardClick = (p)=>{
    setChooserPackage(p)
  }

  const applyEdit = ()=>{
    if(!editing) return
    // validation
    if(!form.name.trim() || !form.serviceType || !form.amount){ alert('Please fill required fields: Package Name, Service Type and Amount'); return }
    const updated = {
      ...editing,
      name: form.name.trim(),
      serviceType: form.serviceType,
      amount: Number(form.amount) || 0,
      bandwidth: form.bandwidth,
      rx_tx_rate: form.rx_tx_rate,
      rx_tx_burst: form.rx_tx_burst,
      rx_tx_burst_threshold: form.rx_tx_burst_threshold,
      rx_tx_burst_time: form.rx_tx_burst_time,
      hotspotSessionTime: form.hotspotSessionTimeValue ? `${form.hotspotSessionTimeValue} ${form.hotspotSessionTimeUnit}` : null,
      hotspotDataLimit: form.hotspotDataLimit ? `${form.hotspotDataLimit} ${form.hotspotDataUnit}` : null,
      routers: form.routers || []
    }
    const next = packages.map(p => p.id === updated.id ? updated : p)
    setPackages(next)
    try{ localStorage.setItem('fastnet:packages', JSON.stringify(next)) }catch(e){ console.error('Failed to persist packages', e) }
    setEditOpen(false)
    setEditing(null)
  }

  const doDelete = (p)=>{
    if(!confirm(`Delete package ${p.name}? This will remove it locally.`)) return
    const next = packages.filter(x=> x.id !== p.id)
    setPackages(next)
    try{ localStorage.setItem('fastnet:packages', JSON.stringify(next)) }catch(e){ console.error('Failed to persist packages', e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Packages</h2>
        <div>
          <button onClick={()=>setOpen(true)} className="px-3 py-1 bg-fastnet text-white rounded">Add Package</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {packages.map(p=> (
              <div key={p.id} className="aspect-square">
                <Card title={p.name} onClick={()=>onCardClick(p)} className="h-full flex flex-col">
            <div className="text-sm">Service: {p.serviceType}</div>
            <div className="text-sm">Price: ${p.amount}</div>
            {p.bandwidth && <div className="text-sm">Bandwidth: {p.bandwidth}</div>}
            {(p.hotspotSessionTime || p.hotspotDataLimit) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {p.hotspotSessionTime && <div>Hotspot Session: {p.hotspotSessionTime}</div>}
                {p.hotspotDataLimit && <div>Hotspot Data Limit: {p.hotspotDataLimit}</div>}
              </div>
            )}
            {p.routers && p.routers.length > 0 && <div className="text-sm">Routers: {p.routers.map(id=> routers.find(r=>r.id===id)?.name || id).join(', ')}</div>}
              {/* chooser/modal will be rendered below when a card is clicked */}
            </Card>
          </div>
        ))}
      </div>

      {/* Package chooser modal: Edit or Delete */}
      <Modal open={!!chooserPackage} onClose={()=>setChooserPackage(null)} title={chooserPackage ? chooserPackage.name : 'Package actions'}>
        <div className="space-y-3">
          <p className="text-sm">Choose an action for this package:</p>
          <div className="flex flex-col gap-2">
            <button onClick={()=>{ if(chooserPackage){ startEdit(chooserPackage); } setChooserPackage(null) }} className="w-full px-3 py-2 rounded bg-blue-50 text-blue-700">Edit</button>
            <PopupButton className="w-full px-3 py-2 rounded bg-red-50 text-red-700" modalTitle={`Delete package ${chooserPackage?.name || ''}?`} modalContent={(close)=> (
              <div className="space-y-3">
                <div className="text-sm">Are you sure you want to delete <strong>{chooserPackage?.name}</strong>? This cannot be undone.</div>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>{ setChooserPackage(null); close() }} className="px-3 py-1 border rounded">Cancel</button>
                  <button onClick={()=>{ if(chooserPackage){ doDelete(chooserPackage) } setChooserPackage(null); close() }} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
            )}>Delete</PopupButton>
            <button onClick={()=>setChooserPackage(null)} className="w-full px-3 py-2 rounded border">Cancel</button>
          </div>
        </div>
      </Modal>
      <Modal open={open} onClose={()=>setOpen(false)} title="Add Package">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Package Name:* Required</label>
            <input className="mt-1 w-full rounded border p-2" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} placeholder="E.g Majengo 8mbps" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Service Type:* Required</label>
              <select className="mt-1 w-full rounded border p-2" value={form.serviceType} onChange={e=>setForm(f=>({...f, serviceType: e.target.value}))}>
                <option>PPPoE</option>
                <option>Hotspot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Amount:* Required</label>
              <input type="number" className="mt-1 w-full rounded border p-2" value={form.amount} onChange={e=>setForm(f=>({...f, amount: e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">Bandwidth LIMIT (Upload/Download)</label>
            <input className="mt-1 w-full rounded border p-2" value={form.bandwidth} onChange={e=>setForm(f=>({...f, bandwidth: e.target.value}))} placeholder="eg: 5M/5M or 64k/64k 256k/256k 128k/128k 10/10" />
            <div className="text-xs text-slate-500 mt-1">Format: [rx/tx-rate] [rx/tx-burst] [rx/tx-burst-threshold] [rx/tx-burst-time]</div>
          </div>

          {/* Hotspot-only fields */}
          {form.serviceType === 'Hotspot' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Hotspot Session Time: Required</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="rounded border p-2 flex-1 w-full" value={form.hotspotSessionTimeValue} onChange={e=>setForm(f=>({...f, hotspotSessionTimeValue: e.target.value}))} />
                  <select className="rounded border px-3 py-2 flex-1 w-full max-w-xs" value={form.hotspotSessionTimeUnit} onChange={e=>setForm(f=>({...f, hotspotSessionTimeUnit: e.target.value}))}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm">Hotspot Data LIMIT: Required</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="rounded border p-2 w-32" value={form.hotspotDataLimit} onChange={e=>setForm(f=>({...f, hotspotDataLimit: e.target.value}))} />
                  <select className="rounded border p-2" value={form.hotspotDataUnit} onChange={e=>setForm(f=>({...f, hotspotDataUnit: e.target.value}))}>
                    <option>MB</option>
                    <option>GB</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm">MAP TO SPECIFIC ROUTER(s)</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-auto">
              {routers.map(r=> (
                <label key={r.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={form.routers.includes(r.id)} onChange={e=>{
                    const checked = e.target.checked
                    setForm(f=> ({...f, routers: checked ? [...f.routers, r.id] : f.routers.filter(id=>id!==r.id) }))
                  }} />
                  <span className="text-sm">{r.name} ({r.ip})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>setOpen(false)} className="px-3 py-1 rounded border">Cancel</button>
            <button onClick={save} className="px-3 py-1 rounded bg-fastnet text-white">Save Package</button>
          </div>
        </div>
      </Modal>
      <Modal open={editOpen} onClose={()=>{ setEditOpen(false); setEditing(null) }} title={`Edit Package - ${editing?.name || ''}`}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Package Name:* Required</label>
            <input className="mt-1 w-full rounded border p-2" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} placeholder="E.g Majengo 8mbps" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Service Type:* Required</label>
              <select className="mt-1 w-full rounded border p-2" value={form.serviceType} onChange={e=>setForm(f=>({...f, serviceType: e.target.value}))}>
                <option>PPPoE</option>
                <option>Hotspot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Amount:* Required</label>
              <input type="number" className="mt-1 w-full rounded border p-2" value={form.amount} onChange={e=>setForm(f=>({...f, amount: e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">Bandwidth LIMIT (Upload/Download)</label>
            <input className="mt-1 w-full rounded border p-2" value={form.bandwidth} onChange={e=>setForm(f=>({...f, bandwidth: e.target.value}))} placeholder="eg: 5M/5M or 64k/64k 256k/256k 128k/128k 10/10" />
            <div className="text-xs text-slate-500 mt-1">Format: [rx/tx-rate] [rx/tx-burst] [rx/tx-burst-threshold] [rx/tx-burst-time]</div>
          </div>

          {/* Hotspot-only fields */}
          {form.serviceType === 'Hotspot' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Hotspot Session Time: Required</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="rounded border p-2 flex-1 w-full" value={form.hotspotSessionTimeValue} onChange={e=>setForm(f=>({...f, hotspotSessionTimeValue: e.target.value}))} />
                  <select className="rounded border px-3 py-2 flex-1 w-full max-w-xs" value={form.hotspotSessionTimeUnit} onChange={e=>setForm(f=>({...f, hotspotSessionTimeUnit: e.target.value}))}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm">Hotspot Data LIMIT: Required</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" className="rounded border p-2 flex-1 w-full" value={form.hotspotDataLimit} onChange={e=>setForm(f=>({...f, hotspotDataLimit: e.target.value}))} />
                  <select className="rounded border p-2 flex-1 w-full max-w-xs" value={form.hotspotDataUnit} onChange={e=>setForm(f=>({...f, hotspotDataUnit: e.target.value}))}>
                    <option>MB</option>
                    <option>GB</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm">MAP TO SPECIFIC ROUTER(s)</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-auto">
              {routers.map(r=> (
                <label key={r.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={form.routers.includes(r.id)} onChange={e=>{
                    const checked = e.target.checked
                    setForm(f=> ({...f, routers: checked ? [...f.routers, r.id] : f.routers.filter(id=>id!==r.id) }))
                  }} />
                  <span className="text-sm">{r.name} ({r.ip})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={()=>{ setEditOpen(false); setEditing(null) }} className="px-3 py-1 rounded border">Cancel</button>
            <button onClick={applyEdit} className="px-3 py-1 rounded bg-fastnet text-white">Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
