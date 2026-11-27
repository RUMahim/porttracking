import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Container as ContainerIcon } from 'lucide-react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { ConfirmModal } from '../components/Modal'
import { SkeletonRows, EmptyState } from '../components/Skeleton'
import StatusStepper, { STATUS_STEPS } from '../components/StatusStepper'
import { fmtWeight } from '../utils/format'

export default function ContainerManagement() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [containers, setContainers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [statusDraft, setStatusDraft] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const { data } = await api.get('/containers', { params })
      setContainers(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (c) => {
    const status = statusDraft[c._id] || c.currentStatus
    if (status === c.currentStatus) return
    try {
      await api.put(`/containers/${c._id}/status`, { status })
      toast.success(`${c.containerId} is now ${status}`)
      load()
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/containers/${confirmDelete._id}`)
      toast.success('Container deleted')
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
          <h1>Containers</h1>
          <p className="muted">Track every container through Booked → Loaded → In Transit → Arrived at Port → Customs Clearance → Delivered. {containers.length} containers.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="row filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : containers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ContainerIcon}
            title="No containers found"
            hint={statusFilter ? 'No containers are at this stage right now.' : 'Containers are created automatically when a shipment is registered.'}
          />
        </div>
      ) : (
        containers.map((c) => (
          <div key={c._id} className="card">
            <div className="list-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div>
                <strong>{c.containerId}</strong>
                <small>{c.goodsType} · {fmtWeight(c.weight)}</small>
                {c.shipment && (
                  <small>
                    <Link to={`/track?q=${encodeURIComponent(c.shipment.trackingId)}`}>{c.shipment.trackingId}</Link>
                    {' · '}{c.shipment.origin} → {c.shipment.destination}
                  </small>
                )}
                {c.shipment?.owner ? <small>Owner: {c.shipment.owner.name} ({c.shipment.owner.role})</small> : (c.shipment?.ownerName ? <small>Owner: {c.shipment.ownerName} (unregistered)</small> : null)}
              </div>
              <span className="pill status">{c.currentStatus}</span>
            </div>
            <StatusStepper currentStatus={c.currentStatus} history={c.statusHistory} />
            {isAdmin && (
              <div className="row">
                <select
                  value={statusDraft[c._id] || c.currentStatus}
                  onChange={(e) => setStatusDraft({ ...statusDraft, [c._id]: e.target.value })}
                >
                  {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn primary small" onClick={() => updateStatus(c)}>Update status</button>
                <button className="btn small danger" onClick={() => setConfirmDelete(c)}><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </div>
        ))
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete container?"
          message={`Container ${confirmDelete.containerId} and its status history will be permanently deleted.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
