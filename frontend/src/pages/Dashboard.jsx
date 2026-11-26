import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'

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
  if (!data) return <p>Loading dashboard…</p>

  const maxType = Math.max(data.importCount, data.exportCount, 1)
  const maxStatus = Math.max(...data.statusBreakdown.map((s) => s.count), 1)

  return (
    <div>
      <h1>Operations Dashboard</h1>
      <p className="muted">Welcome, {user?.name} ({user?.role})</p>

      <div className="stats">
        <div className="stat"><strong>{data.totalShips}</strong><span>Total Ships</span></div>
        <div className="stat"><strong>{data.totalShipments}</strong><span>Total Shipments</span></div>
        <div className="stat"><strong>{data.totalContainers}</strong><span>Total Containers</span></div>
        <div className="stat"><strong>{data.delivered}</strong><span>Delivered</span></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Import vs Export</h2>
          <div className="bar-row"><span>Import</span><div className="bar"><i style={{ width: `${(data.importCount / maxType) * 100}%` }} /></div><strong>{data.importCount}</strong></div>
          <div className="bar-row"><span>Export</span><div className="bar teal"><i style={{ width: `${(data.exportCount / maxType) * 100}%` }} /></div><strong>{data.exportCount}</strong></div>
          <h3>Container pipeline</h3>
          {data.statusBreakdown.map((s) => (
            <div key={s.status} className="bar-row small">
              <span>{s.status}</span>
              <div className="bar"><i style={{ width: `${(s.count / maxStatus) * 100}%` }} /></div>
              <strong>{s.count}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Ships arriving soon</h2>
          {data.arrivingSoon.length === 0 && <p className="muted">No upcoming ships.</p>}
          {data.arrivingSoon.map((ship) => (
            <div key={ship._id} className="list-row">
              <div><strong>{ship.name}</strong><small>{ship.dockNumber} · {ship.company}</small></div>
              <span className={`pill ${ship.status.toLowerCase()}`}>{ship.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Recent shipments</h2>
        {data.recentShipments.length === 0 && <p className="muted">No shipments yet. <Link to="/shipments">Add one</Link></p>}
        {data.recentShipments.map((s) => (
          <div key={s._id} className="list-row">
            <div>
              <strong>{s.trackingId}</strong>
              <small>{s.goodsType} · {s.origin} → {s.destination}</small>
            </div>
            <span className={`pill ${s.type}`}>{s.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
