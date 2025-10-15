import React from 'react'
import Card from '../components/Card'

const STORAGE_KEY = 'fastnet:settings'

export default function Settings(){
  const [state, setState] = React.useState({
    enableFuzzy: true,
    fuzzyThreshold: 0.4,
    debounceMs: 250,
    maxResults: 200
  })

  React.useEffect(()=>{
    try{
      const s = localStorage.getItem(STORAGE_KEY)
      if(s){ const parsed = JSON.parse(s); setState(st => ({...st, ...(parsed.search || parsed)})) }
    }catch(e){}
  },[])

  const save = ()=>{
    try{
      const s = localStorage.getItem(STORAGE_KEY)
      const parsed = s ? JSON.parse(s) : {}
      parsed.search = { enableFuzzy: state.enableFuzzy, fuzzyThreshold: Number(state.fuzzyThreshold), debounceMs: Number(state.debounceMs), maxResults: Number(state.maxResults) }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      alert('Search settings saved (local)')
    }catch(e){ alert('Failed to save settings') }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <Card>
        <h3 className="font-semibold mb-2">Search tuning</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={state.enableFuzzy} onChange={e=>setState(s=>({...s, enableFuzzy: e.target.checked}))} /> <span>Enable fuzzy (typo-tolerant) search</span></label>
          </div>

          <div>
            <label className="block text-xs">Fuzzy threshold (0.0 = exact only, 1.0 = very permissive)</label>
            <input type="range" min="0" max="1" step="0.05" value={state.fuzzyThreshold} onChange={e=>setState(s=>({...s, fuzzyThreshold: Number(e.target.value)}))} />
            <div className="text-xs text-slate-500">Current: {state.fuzzyThreshold}</div>
          </div>

          <div>
            <label className="block text-xs">Search debounce (ms)</label>
            <input type="number" className="w-32 p-1 border rounded" value={state.debounceMs} onChange={e=>setState(s=>({...s, debounceMs: Number(e.target.value)}))} />
          </div>

          <div>
            <label className="block text-xs">Max results to return</label>
            <input type="number" className="w-32 p-1 border rounded" value={state.maxResults} onChange={e=>setState(s=>({...s, maxResults: Number(e.target.value)}))} />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={save} className="px-3 py-1 bg-fastnet text-white rounded">Save search settings</button>
          </div>
        </div>
      </Card>
    </div>
  )
}
