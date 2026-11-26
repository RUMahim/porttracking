import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Package, Search } from 'lucide-react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Modal, ConfirmModal } from '../components/Modal'
import { SkeletonRows, EmptyState } from '../components/Skeleton'
import { fmtDate } from '../utils/format'

const EMPTY = { type: 'import', containerId: '', goodsType: '', origin: '', destination: '', ship: '', owner: '', weight: '', trackingId: '' }

export default function ShipmentManagement() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [shipments, setShipments] = useState([])
  const [ships, setShips] = useState([])
  const [owners, setOwners] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
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
    setBusy(true)
    try {
      const payload = { ...form, weight: form.weight ? Number(form.weight) : 0 }
      if (!payload.ship) delete payload.ship
      if (!payload.owner) delete payload.owner
      if (!payload.trackingId) delete payload.trackingId
      const { data } = await api.post('/shipments', payload)
      toast.success(`Shipment created — tracking ID ${data.shipment.trackingId}`)
      setForm(EMPTY)
      setShowForm(false)
      load()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/shipments/${confirmDelete._id}`)
      toast.success('Shipment deleted')
      setConfirmDelete(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Shipment Management</h1>
          <p className="muted">Register import and export shipments. A container is created automatically with status Booked. {shipments.length} shipments.</p>
        </div>
        <button className="btn primary" onClick={() => { setForm(EMPTY); setError(''); setShowForm(true) }}>
          <Plus size={16} /> New shipment
        </button>
      </div>

      <div className="row filters">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking ID, container, goods…" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="import">Import</option>
          <option value="export">Export</option>
        </select>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : shipments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="No shipments found"
            hint={search || typeFilter ? 'Try a different search or filter.' : 'Register your first shipment to start tracking it.'}
            action={!search && !typeFilter && (
              <button className="btn primary small" onClick={() => setShowForm(true)}><Plus size={14} /> New shipment</button>
            )}
          />
        </div>
      ) : (
        <div className="card table-wrap" style={{ padding: 6 }}>
          <table className="data">
            <thead>
              <tr><th>Tracking ID</th><th>Type</th><th>Cargo</th><th>Route</th><th>Ship</th><th>Owner</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.trackingId}</strong><span className="sub">Container {s.containerId}</span></td>
                  <td><span className={`pill ${s.type}`}>{s.type}</span></td>
                  <td>{s.goodsType}</td>
                  <td>{s.origin} → {s.destination}</td>
                  <td>{s.ship ? s.ship.name : '—'}</td>
                  <td>{s.owner ? s.owner.name : '—'}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <Link className="btn small" to={`/track?q=${encodeURIComponent(s.trackingId)}`}><Search size={13} /> Track</Link>
                      <button className="btn small danger" onClick={() => setConfirmDelete(s)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="New shipment" onClose={() => setShowForm(false)} wide>
          <form onSubmit={submit} className="form grid-form">
            <label>Type
              <select value={form.type} onChange={set('type')}>
                <option value="import">Import</option>
                <option value="export">Export</option>
              </select>
            </label>
            <label>Container ID<input value={form.containerId} onChange={set('containerId')} placeholder="MSKU-482910-3" required /></label>
            <label>Goods type<input value={form.goodsType} onChange={set('goodsType')} placeholder="Electronics" required /></label>
            <label>Container weight (kg)<input type="number" min="0" value={form.weight} onChange={set('weight')} placeholder="18400" /></label>
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
            <label>Tracking ID (optional)<input value={form.trackingId} onChange={set('trackingId')} placeholder="Auto: PT-2026-XXXX" /></label>
            {error && <p className="error" style={{ gridColumn: '1 / -1' }}>{error}</p>}
            <div className="row end">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create shipment'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete shipment?"
          message={`Shipment ${confirmDelete.trackingId} and its container will be permanently deleted.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
