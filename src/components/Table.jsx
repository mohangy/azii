import React from 'react'

/**
 * Table
 * - Small utility table that renders rows based on `columns` descriptors and `data` array.
 * - Each column may provide a `render` function for custom cell rendering; otherwise a key name is used.
 * - Each column may provide a `className` for responsive visibility (e.g. 'hidden md:table-cell').
 * - Keeps markup minimal; pagination/filtering/search should be implemented at the page level.
 */
export default function Table({columns, data}){
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {columns.map(c => <th key={c.key} className={`px-3 py-2 ${c.className || ''}`}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-slate-100 dark:border-slate-700">
              {columns.map(c => <td key={c.key} className={`px-3 py-2 ${c.className || ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
