import React from 'react'

/**
 * Card
 * - Small visual container used throughout the app for grouping related content.
 * - Accepts `title` for a small heading and `className` for custom sizing/spacing.
 */
export default function Card({children, title, className='', onClick}){
  const clickable = typeof onClick === 'function'
  return (
    <div
      onClick={onClick}
      onKeyDown={e => { if(clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e) } }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
  className={`relative bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-blue-900/40 ring-1 ring-slate-200/60 dark:ring-blue-800/20 ring-inset rounded-md p-4 shadow-sm dark:shadow-none transition-transform duration-[var(--transition-fast)] motion-reduce:transform-none motion-reduce:transition-none md:hover:-translate-y-1 md:hover:shadow-lg ${clickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-fastnet/30' : ''} ${className}`}
    >
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      {children}
    </div>
  )
}
