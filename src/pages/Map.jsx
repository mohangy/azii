import React from 'react'
import Card from '../components/Card'
import { fetchMock } from '../services/api'
import { useNavigate } from 'react-router-dom'

function parseCoords(coords){
  if(!coords) return null
  try{ const parts = String(coords).split(',').map(s=>s.trim()); if(parts.length<2) return null; const lat = parseFloat(parts[0]); const lon = parseFloat(parts[1]); if(isNaN(lat) || isNaN(lon)) return null; return { lat, lon } }catch(e){ return null }
}

export default function Map(){
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [mapLibs, setMapLibs] = React.useState(null)
  const [mapError, setMapError] = React.useState(false)
  const navigate = useNavigate()

  // dynamically load react-leaflet, leaflet and cluster plugin.
  React.useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const [rl, clusterModule, Lmod, icon2x, icon, shadow] = await Promise.all([
          import('react-leaflet'),
          import('react-leaflet-cluster'),
          import('leaflet'),
          import('leaflet/dist/images/marker-icon-2x.png'),
          import('leaflet/dist/images/marker-icon.png'),
          import('leaflet/dist/images/marker-shadow.png')
        ])
        if(!mounted) return
        const Llib = Lmod && (Lmod.default || Lmod)
        // merge options for default marker icons (use imported images)
        try{
          Llib.Icon.Default.mergeOptions({
            iconRetinaUrl: (icon2x && (icon2x.default || icon2x)),
            iconUrl: (icon && (icon.default || icon)),
            shadowUrl: (shadow && (shadow.default || shadow))
          })
        }catch(e){ /* ignore icon merge errors */ }

        setMapLibs({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Popup: rl.Popup,
          MarkerClusterGroup: (clusterModule && (clusterModule.default || clusterModule))
        })
      }catch(e){
        console.error('Failed to load map libraries', e)
        if(mounted) setMapError(true)
      }
    })()
    return ()=> mounted = false
  },[])

  React.useEffect(()=>{
    let mounted = true
    Promise.all([fetchMock('mockUsers')]).then(([u])=>{
      if(!mounted) return
      let persisted = []
      try{ const s = localStorage.getItem('fastnet:users'); persisted = s ? JSON.parse(s) : [] }catch(e){}
      const all = [...(persisted||[]), ...(u||[])]
      const parsed = all.map(x => ({ ...x, coordsParsed: parseCoords(x.coords) }))
      setUsers(parsed)
      setLoading(false)
    })
    return ()=> mounted = false
  },[])

  // determine a sensible center and zoom from available coords
  const coordsList = users.map(u=>u.coordsParsed).filter(Boolean)
  const avgLat = coordsList.length ? coordsList.reduce((s,c)=>s+c.lat,0)/coordsList.length : 0
  const avgLon = coordsList.length ? coordsList.reduce((s,c)=>s+c.lon,0)/coordsList.length : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Network Coverage Map</h2>
        <div className="text-sm text-slate-500">Interactive map with clustering — click a marker to open user details</div>
      </div>

      <Card>
        {loading ? (
          <div>Loading users...</div>
        ) : mapError ? (
          <div className="p-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="font-semibold mb-2">Map unavailable</div>
            <div>There was an issue loading the map component. The rest of the dashboard is available — try reloading the page or check your network connection. If the problem persists, you can continue without the interactive map.</div>
          </div>
        ) : !mapLibs ? (
          <div>Loading map libraries...</div>
        ) : (
          <div className="w-full h-[600px]">
            <mapLibs.MapContainer center={[avgLat || 0, avgLon || 0]} zoom={coordsList.length ? 10 : 2} className="w-full h-full">
              <mapLibs.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <mapLibs.MarkerClusterGroup chunkedLoading>
                {users.filter(u=>u.coordsParsed).map((u, idx) => (
                  <mapLibs.Marker key={idx} position={[u.coordsParsed.lat, u.coordsParsed.lon]} eventHandlers={{ click: ()=> navigate(`/users/${u.username}`) }}>
                    <mapLibs.Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{u.username}</div>
                        <div>{u.names || ''}</div>
                        <div className="text-xs text-slate-500">{u.package || ''} • {u.location || ''}</div>
                        <div className="mt-2"><button onClick={()=> navigate(`/users/${u.username}`)} className="px-2 py-1 bg-fastnet text-white rounded text-xs">Open profile</button></div>
                      </div>
                    </mapLibs.Popup>
                  </mapLibs.Marker>
                ))}
              </mapLibs.MarkerClusterGroup>
            </mapLibs.MapContainer>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">Legend</h3>
        <div className="text-sm">
          <div>Markers indicate user coordinates. Clusters group nearby users.</div>
        </div>
      </Card>
    </div>
  )
}
