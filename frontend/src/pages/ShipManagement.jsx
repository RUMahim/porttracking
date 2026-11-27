import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Ship } from 'lucide-react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Modal, ConfirmModal } from '../components/Modal'
import { SkeletonRows, EmptyState } from '../components/Skeleton'
import { fmtDate } from '../utils/format'

const EMPTY = { name: '', imo: '', company: '', arrivalDate: '', departureDate: '', dockNumber: '', status: 'Expected' }
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function ShipManagement() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [ships, setShips] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/ships')
      setShips(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true) }
  const openEdit = (ship) => {
    setForm({
      name: ship.name, imo: ship.imo, company: ship.company,
      arrivalDate: toDateInput(ship.arrivalDate), departureDate: toDateInput(ship.departureDate),
      dockNumber: ship.dockNumber, status: ship.status,
    })
    setEditId(ship._id)
    setError('')
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (editId) await api.put(`/ships/${editId}`, form)
      else await api.post('/ships', form)
      toast.success(editId ? 'Ship updated' : 'Ship added')
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
      await api.delete(`/ships/${confirmDelete._id}`)
      toast.success('Ship deleted')
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
          <h1>Ship Management</h1>
          <p className="muted">Ship arrivals, departures and docks · {ships.length} ships</p>
        </div>
        {isAdmin && (
          <button className="btn primary" onClick={openAdd}><Plus size={16} /> Add ship</button>
        )}
      </div>

      {loading ? (
        <SkeletonRows />
      ) : ships.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Ship}
            title="No ships yet"
            hint={isAdmin ? 'Add the first vessel to start tracking arrivals and departures.' : 'No ships have been registered yet.'}
            action={isAdmin && <button className="btn primary small" onClick={openAdd}><Plus size={14} /> Add ship</button>}
          />
        </div>
      ) : (
        <div className="card table-wrap" style={{ padding: 6 }}>
          <table className="data">
            <thead>
              <tr><th>Ship</th><th>Company</th><th>Dock</th><th>Arrival</th><th>Departure</th><th>Status</th>{isAdmin && <th></th>}</tr>
            </thead>
            <tbody>
              {ships.map((ship) => (
                <tr key={ship._id}>
                  <td><strong>{ship.name}</strong><span className="sub">{ship.imo}</span></td>
                  <td>{ship.company}</td>
                  <td>{ship.dockNumber}</td>
                  <td>{fmtDate(ship.arrivalDate)}</td>
                  <td>{fmtDate(ship.departureDate)}</td>
                  <td><span className={`pill ${ship.status.toLowerCase()}`}>{ship.status}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => openEdit(ship)}><Pencil size={13} /> Edit</button>
                        <button className="btn small danger" onClick={() => setConfirmDelete(ship)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editId ? 'Edit ship' : 'Add ship'} onClose={() => setShowForm(false)} wide>
          <form onSubmit={submit} className="form grid-form">
            <label>Ship name<input value={form.name} onChange={set('name')} required /></label>
            <label>IMO number<input value={form.imo} onChange={set('imo')} required /></label>
            <label>Company<input value={form.company} onChange={set('company')} required /></label>
            <label>Dock number<input value={form.dockNumber} onChange={set('dockNumber')} required /></label>
            <label>Arrival date<input type="date" value={form.arrivalDate} onChange={set('arrivalDate')} required /></label>
            <label>Departure date<input type="date" value={form.departureDate} onChange={set('departureDate')} required /></label>
            <label>Status
              <select value={form.status} onChange={set('status')}>
                <option>Expected</option><option>Arrived</option><option>Departed</option>
              </select>
            </label>
            {error && <p className="error" style={{ gridColumn: '1 / -1' }}>{error}</p>}
            <div className="row end">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update ship' : 'Add ship'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete ship?"
          message={`"${confirmDelete.name}" will be removed from the register. Shipments linked to it will keep their records.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
