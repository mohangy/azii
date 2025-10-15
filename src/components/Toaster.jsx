import React from 'react'
import { useStore } from '../store/useStore'

export default function Toaster(){
  const toasts = useStore(s => s.toasts || [])
  const remove = useStore(s => s.removeToast)
  return (
  <div className="fixed right-4 bottom-4 z-[10020] flex flex-col gap-2">
      {toasts.map(t=> (
        <div key={t.id} className={`px-3 py-2 rounded shadow ${t.type==='error' ? 'bg-red-600 text-white' : t.type==='success' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>{t.message}</div>
            <button onClick={()=>remove(t.id)} className="text-sm opacity-70">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
