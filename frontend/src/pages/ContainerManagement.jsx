import { useCallback, useEffect, useState } from 'react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import StatusStepper, { STATUS_STEPS } from '../components/StatusStepper'

export default function ContainerManagement() {
  const { isAdmin } = useAuth()
  const [containers, setContainers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
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

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/containers/${id}/status`, { status })
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this container?')) return
    try {
      await api.delete(`/containers/${id}`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <div>
      <h1>Containers</h1>
      <p className="muted">Track every container through Booked → Loaded → In Transit → Arrived at Port → Customs Clearance → Delivered.</p>
      {error && <p className="error">{error}</p>}
      <div className="row filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading && <p>Loading…</p>}
      {!loading && containers.length === 0 && <p className="muted">No containers found.</p>}
      {containers.map((c) => (
        <div key={c._id} className="card">
          <div className="list-row">
            <div>
              <strong>{c.containerId}</strong>
              <small>{c.goodsType} · {c.weight} kg{c.shipment ? ` · ${c.shipment.trackingId} · ${c.shipment.origin} → ${c.shipment.destination}` : ''}</small>
              {c.shipment?.owner && <small>Owner: {c.shipment.owner.name} ({c.shipment.owner.role})</small>}
            </div>
            <span className="pill status">{c.currentStatus}</span>
          </div>
          <StatusStepper currentStatus={c.currentStatus} history={c.statusHistory} />
          {isAdmin && (
            <div className="row">
              <select defaultValue={c.currentStatus} id={`status-${c._id}`}>
                {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn primary small" onClick={() => updateStatus(c._id, document.getElementById(`status-${c._id}`).value)}>
                Update status
              </button>
              <button className="btn small danger" onClick={() => remove(c._id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
