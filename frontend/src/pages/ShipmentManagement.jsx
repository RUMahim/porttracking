import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'

const EMPTY = { type: 'import', containerId: '', goodsType: '', origin: '', destination: '', ship: '', owner: '', weight: '', trackingId: '' }

export default function ShipmentManagement() {
  const { isAdmin, user } = useAuth()
  const [shipments, setShipments] = useState([])
  const [ships, setShips] = useState([])
  const [owners, setOwners] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const params = {}
      if (search) params.search = search
      if (typeFilter) params.type = typeFilter
      const { data } = await api.get('/shipments', { params })
      setShipments(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/ships').then(({ data }) => setShips(data)).catch(() => {})
    if (isAdmin) api.get('/users').then(({ data }) => setOwners(data)).catch(() => {})
  }, [isAdmin])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    try {
      const payload = { ...form, weight: form.weight ? Number(form.weight) : 0 }
      if (!payload.ship) delete payload.ship
      if (!payload.owner) delete payload.owner
      if (!payload.trackingId) delete payload.trackingId
      const { data } = await api.post('/shipments', payload)
      setNotice(`Shipment created with tracking ID ${data.shipment.trackingId}`)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this shipment and its container?')) return
    try {
      await api.delete(`/shipments/${id}`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <div>
      <h1>Shipment Management</h1>
      <p className="muted">Register import and export shipments. A container is created automatically with status Booked.</p>
      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}

      <form onSubmit={submit} className="card form grid-form">
        <h2>Add shipment</h2>
        <label>Type
          <select value={form.type} onChange={set('type')}>
            <option value="import">Import</option>
            <option value="export">Export</option>
          </select>
        </label>
        <label>Container ID<input value={form.containerId} onChange={set('containerId')} placeholder="MSKU-482910-3" required /></label>
        <label>Goods type<input value={form.goodsType} onChange={set('goodsType')} placeholder="Electronics" required /></label>
        <label>Origin<input value={form.origin} onChange={set('origin')} placeholder="Shenzhen, China" required /></label>
        <label>Destination<input value={form.destination} onChange={set('destination')} placeholder="Chattogram Port" required /></label>
        <label>Ship
          <select value={form.ship} onChange={set('ship')}>
            <option value="">Select ship (optional)</option>
            {ships.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.dockNumber}</option>)}
          </select>
        </label>
        {isAdmin && (
          <label>Owner (importer/exporter)
            <select value={form.owner} onChange={set('owner')}>
              <option value="">Myself ({user?.name})</option>
              {owners.map((o) => <option key={o._id} value={o._id}>{o.name} ({o.role})</option>)}
            </select>
          </label>
        )}
        <label>Container weight (kg)<input type="number" min="0" value={form.weight} onChange={set('weight')} placeholder="18400" /></label>
        <label>Tracking ID (optional)<input value={form.trackingId} onChange={set('trackingId')} placeholder="Auto: PT-2026-XXXX" /></label>
        <div className="row"><button className="btn primary">Add shipment</button></div>
      </form>

      <div className="card">
        <h2>Shipments</h2>
        <div className="row filters">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking ID, container, goods…" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="import">Import</option>
            <option value="export">Export</option>
          </select>
        </div>
        {loading && <p>Loading…</p>}
        {!loading && shipments.length === 0 && <p className="muted">No shipments found.</p>}
        {shipments.map((s) => (
          <div key={s._id} className="list-row">
            <div>
              <strong>{s.trackingId}</strong> <span className={`pill ${s.type}`}>{s.type}</span>
              <small>Container {s.containerId} · {s.goodsType}</small>
              <small>{s.origin} → {s.destination}{s.ship ? ` · ${s.ship.name}` : ''}{s.owner ? ` · ${s.owner.name}` : ''}</small>
            </div>
            <div className="row">
              <Link className="btn small" to={`/track?q=${encodeURIComponent(s.trackingId)}`}>Track</Link>
              <button className="btn small danger" onClick={() => remove(s._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
