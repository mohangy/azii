import React, {useState} from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Eye, EyeOff } from 'lucide-react'
import Card from '../components/Card'
import mockStats from '../data/mockStats.json'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { fetchMock } from '../services/api'
import Modal from '../components/Modal'

function OverviewCard({id, title, value, delta, sensitive=false, showSensitive=false, onToggle}){
  const display = sensitive && !showSensitive ? '••••' : value

  return (
    <Card className="p-4 relative">
      {/* Eye toggle sits at the top-right (header area) */}
      {sensitive && (
        <button onClick={()=>onToggle && onToggle(id)} className="absolute top-3 right-3 p-1 rounded bg-slate-700 text-white">
          {showSensitive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      )}
      <div>
    <div className="text-xs text-slate-500">{title}</div>
  <div className="text-lg md:text-xl font-semibold">{display}</div>
      </div>
      {/* Delta percent positioned at bottom-right */}
      <div className="absolute bottom-3 right-3 text-sm">
        <span className={`${delta>=0 ? 'text-green-600' : 'text-red-600'}`}>{delta>=0?`+${delta}%`:`${delta}%`}</span>
      </div>
    </Card>
  )
}

/**
 * Dashboard
 * - Renders overview cards and an income stacked bar chart using sample data from `mockStats.json`.
 * - Polls the mock transactions and mock users periodically to refresh the Recent Activity feed.
 */
export default function Dashboard(){
  const {overview, chartData} = mockStats
  const [activity, setActivity] = useState(mockStats.activity)
  const [users, setUsers] = React.useState([])
  const [activeModalOpen, setActiveModalOpen] = React.useState(false)
  const [onlineModalOpen, setOnlineModalOpen] = React.useState(false)
  const navigate = useNavigate()
  const goToActive = ()=>{
    // open chooser modal instead of navigating directly
    setActiveModalOpen(true)
  }
  const goToOnline = ()=>{
    // open chooser modal for Online users
    setOnlineModalOpen(true)
  }

  React.useEffect(()=>{
    let mounted = true
    fetchMock('mockUsers').then(u=>{
      if(!mounted) return
      let persisted = []
      try{ const s = localStorage.getItem('fastnet:users'); persisted = s? JSON.parse(s) : [] }catch(e){}
      setUsers([...(persisted || []), ...(u || [])])
    })
    return ()=> mounted = false
  },[])

  // poll for new transactions and user creations every 5 seconds
  React.useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      const tx = await fetchMock('mockTransactions')
      const users = await fetchMock('mockUsers')
      const txItems = (tx || []).map(t=> ({user: t.user, action: `Paid Mpesa receipt (${t.ref})`, time: new Date(t.createdAt).toLocaleString()}))
      const userItems = (users || []).map(u=> ({user: u.username, action: `Created ${u.type} user`, time: new Date(u.createdAt).toLocaleString()}))
      const merged = [...txItems, ...userItems].sort((a,b)=> new Date(b.time) - new Date(a.time))
      if(mounted) setActivity(merged)
    }
    load()
    const iv = setInterval(load, 5000)
    return ()=>{ mounted = false; clearInterval(iv) }
  },[])
  const [range, setRange] = useState('daily')
  const [rangeModal, setRangeModal] = useState(false)
  const data = chartData[range] || []
  
  const selectRange = (period) => {
    setRange(period)
    setRangeModal(false)
  }
  
  const theme = useStore(state => state.theme)
  const axisColor = theme === 'dark' ? '#94a3b8' : '#334155' // slate-400 vs slate-700
  const tooltipBg = theme === 'dark' ? '#0b1220' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e6e6e6'
  const tooltipLabelColor = theme === 'dark' ? '#e6eef8' : '#0f172a'
  // custom tick to render small Y-axis labels shifted left (outside chart area)
  const CustomYAxisTick = (props) => {
    const { x, y, payload } = props
    return (
      <text x={x - 36} y={y + 4} fill={axisColor} fontSize={11} textAnchor="end">
        {payload.value}
      </text>
    )
  }

  // format date like 'Sun, 12th'
  const ordinal = (n) => {
    const s = ["th","st","nd","rd"]
    const v = n % 100
    if (v >= 11 && v <= 13) return `${n}th`
    const last = n % 10
    return `${n}${s[last] || 'th'}`
  }

  const formatDayDate = (value) => {
    // try parsing ISO date
    const d = new Date(value)
    if (!isNaN(d.getTime())){
      const weekday = d.toLocaleDateString(undefined, { weekday: 'short' })
      return `${weekday}, ${ordinal(d.getDate())}`
    }
    return value
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* per-card visibility state */}
        <SensitiveCards />
        <div onClick={goToActive} role="button" tabIndex={0} className="cursor-pointer">
          <OverviewCard id="active" title="Active users" value={(
            <div className="flex flex-col">
              <span>PPPoE: {users.filter(x=>x.type==='PPPoE' && (x.status||'')==='Active').length}</span>
              <span>Hotspot: {users.filter(x=>x.type==='Hotspot' && (x.status||'')==='Active').length}</span>
            </div>
          )} delta={overview.activeDelta} />
        </div>
        <div onClick={goToOnline} role="button" tabIndex={0} className="cursor-pointer">
          <OverviewCard id="online" title="Online users" value={(
            <div className="flex flex-col">
              <span>PPPoE: {users.filter(x=>x.type==='PPPoE' && (x.status||'')==='Online').length}</span>
              <span>Hotspot: {users.filter(x=>x.type==='Hotspot' && (x.status||'')==='Online').length}</span>
            </div>
          )} delta={overview.onlineDelta} />
        </div>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <Card title={null} className="col-span-2 h-56 sm:h-72 lg:h-96">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">Income</h3>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400 hidden sm:block">Mobile Money</div>
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <div className="text-xs text-slate-400 hidden sm:block">Cash</div>
              <div className="w-3 h-3 bg-red-500 rounded" />
              <button
                onClick={() => setRangeModal(true)}
                className="ml-4 px-2 py-1 text-sm rounded bg-slate-700 dark:bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <span>
                  {range === 'daily' ? 'Daily' :
                   range === 'weekly' ? 'Weekly' :
                   range === 'monthly' ? 'Monthly' :
                   'Yearly'}
                </span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* Reduced left padding and margin so the chart starts nearer the card's left edge */}
              <BarChart data={data} margin={{ top: 20, right: 40, left: 8, bottom: 36 }}>
                <XAxis
                  dataKey="date"
                  stroke={axisColor}
                  tick={{fill: axisColor}}
                  tickFormatter={(val)=>{
                    if(range === 'daily' || range === 'weekly') return formatDayDate(val)
                    if(range === 'monthly'){
                      // monthly data may use short month names 'Jan' - show as is
                      // but if it's an ISO date, still format
                      const d = new Date(val)
                      if(!isNaN(d.getTime())) return formatDayDate(val)
                      return val
                    }
                    return val
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={<CustomYAxisTick/>} width={20} />
                <Tooltip
                  wrapperStyle={{outline: 'none'}}
                  contentStyle={{background: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipLabelColor}}
                  labelStyle={{color: tooltipLabelColor}}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{color: axisColor}} />
                <Bar dataKey="mobile" stackId="a" fill="#6ea8ff" />
                <Bar dataKey="cash" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

  <Card title="Recent activity" className="h-56 sm:h-72 lg:h-96 overflow-y-auto pl-3">
          <ul className="space-y-3">
            {activity.map((a,i)=>(
              <li key={i} className="text-sm">
                <div className="font-medium">{a.user}</div>
                <div className="text-slate-500">{a.action} • {a.time}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Modal open={activeModalOpen} onClose={()=>setActiveModalOpen(false)} title="Open Active Users">
        <div className="space-y-3">
          <p className="text-sm">Choose which active users list to view:</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={()=>{ setActiveModalOpen(false); navigate('/users/pppoe?status=Active') }} className="w-full sm:w-auto px-3 py-2 rounded bg-fastnet text-white">PPPoE</button>
            <button onClick={()=>{ setActiveModalOpen(false); navigate('/users/hotspot?status=Active') }} className="w-full sm:w-auto px-3 py-2 rounded border">Hotspot</button>
          </div>
        </div>
      </Modal>
      <Modal open={onlineModalOpen} onClose={()=>setOnlineModalOpen(false)} title="Open Online Users">
        <div className="space-y-3">
          <p className="text-sm">Choose which online users list to view:</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={()=>{ setOnlineModalOpen(false); navigate('/users/pppoe?status=Online') }} className="w-full sm:w-auto px-3 py-2 rounded bg-fastnet text-white">PPPoE</button>
            <button onClick={()=>{ setOnlineModalOpen(false); navigate('/users/hotspot?status=Online') }} className="w-full sm:w-auto px-3 py-2 rounded border">Hotspot</button>
          </div>
        </div>
      </Modal>

      {/* Range Selection Modal */}
      <Modal open={rangeModal} onClose={() => setRangeModal(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Time Range</h2>
          <div className="space-y-2">
            {[
              { value: 'daily', label: 'Daily', desc: 'View daily income' },
              { value: 'weekly', label: 'Weekly', desc: 'View weekly trends' },
              { value: 'monthly', label: 'Monthly', desc: 'View monthly breakdown' },
              { value: 'yearly', label: 'Yearly', desc: 'View yearly comparison' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => selectRange(option.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${range === option.value ? 'bg-fastnet/10 border-fastnet' : ''}`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SensitiveCards(){
  const [visible, setVisible] = React.useState({ today: false, month: false })
  const toggle = (id)=>{
    setVisible(v => ({...v, [id === 'today' ? 'today' : 'month']: !v[id === 'today' ? 'today' : 'month']}))
  }
  return (
    <>
      <OverviewCard id="today" title="Today's income" value={`$${mockStats.overview.today}`} delta={mockStats.overview.todayDelta} sensitive showSensitive={visible.today} onToggle={toggle} />
      <OverviewCard id="month" title="Monthly income" value={`$${mockStats.overview.month}`} delta={mockStats.overview.monthDelta} sensitive showSensitive={visible.month} onToggle={toggle} />
    </>
  )
}
