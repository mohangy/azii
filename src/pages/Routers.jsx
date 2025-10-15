import React from 'react'
import Card from '../components/Card'
import mockRouters from '../data/mockRouters.json'

export default function Routers(){
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Routers / NAS</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockRouters.map(r=> (
          <Card key={r.id} title={r.name}>
            <div className="text-sm">IP: {r.ip}</div>
            <div className="text-sm">Uptime: {r.uptime}</div>
            <div className="text-sm">Sessions: {r.sessions}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
