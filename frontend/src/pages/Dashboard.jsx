import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ship, Package, Container, CheckCircle2, PackageSearch } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { SkeletonCards, SkeletonRows, EmptyState } from '../components/Skeleton'
import { fmtDate, roleLabel } from '../utils/format'

const COLORS = { import: '#2563eb', export: '#0e9a8b', bar: '#123458' }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => setError(apiError(err)))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!data) {
    return (
      <div>
        <h1>Operations Dashboard</h1>
        <p className="muted">Welcome, {user?.name} ({roleLabel(user?.role)})</p>
        <SkeletonCards />
        <SkeletonRows />
      </div>
    )
  }

  const mix = [
    { name: 'Import', value: data.importCount, fill: COLORS.import },
    { name: 'Export', value: data.exportCount, fill: COLORS.export },
  ].filter((d) => d.value > 0)
  const statusData = data.statusBreakdown.map((s) => ({ name: s.status.replace(' at Port', ''), count: s.count }))

  return (
    <div>
      <h1>Operations Dashboard</h1>
      <p className="muted">Welcome, {user?.name} ({roleLabel(user?.role)})</p>

      <div className="stats">
        <div className="stat">
          <div className="stat-icon navy"><Ship size={20} /></div>
          <div><strong>{data.totalShips}</strong><span>Total Ships</span></div>
        </div>
        <div className="stat">
          <div className="stat-icon blue"><Package size={20} /></div>
          <div><strong>{data.totalShipments}</strong><span>Total Shipments</span></div>
        </div>
        <div className="stat">
          <div className="stat-icon teal"><Container size={20} /></div>
          <div><strong>{data.totalContainers}</strong><span>Total Containers</span></div>
        </div>
        <div className="stat">
          <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          <div><strong>{data.delivered}</strong><span>Delivered</span></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Import vs Export</h2>
          {mix.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No shipments yet" hint="Import and export counts will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                  {mix.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <span className="pill import">Import · {data.importCount}</span>
            <span className="pill export">Export · {data.exportCount}</span>
          </div>
          <h3>Container pipeline</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.bar} radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Ships arriving soon</h2>
          {data.arrivingSoon.length === 0 && (
            <EmptyState icon={Ship} title="No upcoming ships" hint="Ships with future arrivals will be listed here." />
          )}
          {data.arrivingSoon.map((ship) => (
            <div key={ship._id} className="list-row">
              <div>
                <strong>{ship.name}</strong>
                <small>{ship.dockNumber} · {ship.company}</small>
                <small>Arrival {fmtDate(ship.arrivalDate)} · Departure {fmtDate(ship.departureDate)}</small>
              </div>
              <span className={`pill ${ship.status.toLowerCase()}`}>{ship.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Recent shipments</h2>
        {data.recentShipments.length === 0 && (
          <EmptyState
            icon={Package}
            title="No shipments yet"
            hint="Register your first import or export shipment to see it here."
            action={<Link className="btn primary small" to="/shipments">Add shipment</Link>}
          />
        )}
        {data.recentShipments.map((s) => (
          <div key={s._id} className="list-row">
            <div>
              <strong>{s.trackingId}</strong>
              <small>{s.goodsType} · {s.origin} → {s.destination}</small>
              <small>{fmtDate(s.createdAt)}{s.owner ? ` · ${s.owner.name}` : (s.ownerName ? ` · ${s.ownerName}` : '')}</small>
            </div>
            <span className={`pill ${s.type}`}>{s.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
