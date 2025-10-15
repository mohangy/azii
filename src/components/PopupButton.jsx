import React from 'react'
import Modal from './Modal'

export default function PopupButton({ children, className='', modalTitle='Confirm action', modalBody=null, modalContent=null, onConfirm, confirmLabel='Proceed', cancelLabel='Cancel', buttonProps={} }){
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async ()=>{
    if(!onConfirm) { setOpen(false); return }
    try{
      setLoading(true)
      await onConfirm()
    }catch(e){
      console.error('PopupButton onConfirm error', e)
    }finally{
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button {...buttonProps} onClick={(e)=>{ e.preventDefault(); setOpen(true) }} className={className}>{children}</button>
      <Modal open={open} onClose={()=>setOpen(false)} title={modalTitle}>
        { modalContent ? (
          // allow full control over modal content when provided
          // modalContent can be a React node or a render function that receives a `close` callback
          (typeof modalContent === 'function') ? modalContent(()=>setOpen(false)) : modalContent
        ) : (
          <div className="space-y-3">
            <div className="text-sm">{ modalBody || (typeof children === 'string' ? `${children}` : 'Are you sure you want to continue?') }</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setOpen(false)} className="px-3 py-1 border rounded">{cancelLabel}</button>
              <button onClick={handleConfirm} disabled={loading} className={`px-3 py-1 rounded bg-fastnet text-white ${loading? 'opacity-60 cursor-wait':''}`}>{loading ? 'Working...' : confirmLabel}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
