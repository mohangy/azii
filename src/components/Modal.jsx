import React from 'react'

/**
 * Modal
 * - Simple modal wrapper used across the app. Renders children in a centered overlay.
 * - `open` controls visibility; `onClose` should close the modal (passed down from parent).
 *
 * Note: This component is intentionally minimal. For production use, add keyboard handling
 * (Escape to close), focus trap, and aria attributes for better accessibility.
 */
export default function Modal({open, onClose, title, children}){
  const ref = React.useRef(null)
  React.useEffect(()=>{
    if(!open) return
    function onKey(e){ if(e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[open, onClose])

  if(!open) return null
  return (
    // backdrop-blur applies a blur to elements behind this overlay so focus stays on the dialog
    // Use a z-index higher than the sidebar (z-[9999]) so dialogs always appear on top
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
  <div ref={ref} onClick={e=>e.stopPropagation()} className="relative z-20 bg-white dark:bg-blue-950/90 border border-slate-200 dark:border-blue-900/50 rounded-md w-full max-w-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-blue-900/40">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="ml-4 inline-flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-blue-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700 dark:text-slate-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 8.586L15.95 2.636a1 1 0 111.414 1.414L11.414 10l5.95 5.95a1 1 0 01-1.414 1.414L10 11.414l-5.95 5.95A1 1 0 012.636 15.95L8.586 10 2.636 4.05A1 1 0 014.05 2.636L10 8.586z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="p-4">
          {/* Standard form spacing: vertical rhythm and consistent label spacing */}
          <div className="space-y-4 text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
