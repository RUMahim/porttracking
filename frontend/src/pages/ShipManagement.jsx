import { useCallback, useEffect, useState } from 'react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name: '', imo: '', company: '', arrivalDate: '', departureDate: '', dockNumber: '', status: 'Expected' }
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export default function ShipManagement() {
  const { isAdmin } = useAuth()
  const [ships, setShips] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
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

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editId) await api.put(`/ships/${editId}`, form)
      else await api.post('/ships', form)
      setForm(EMPTY)
      setEditId(null)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const edit = (ship) => {
    setForm({
      name: ship.name, imo: ship.imo, company: ship.company,
      arrivalDate: toDateInput(ship.arrivalDate), departureDate: toDateInput(ship.departureDate),
      dockNumber: ship.dockNumber, status: ship.status,
    })
    setEditId(ship._id)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this ship?')) return
    try {
      await api.delete(`/ships/${id}`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <div>
      <h1>Ship Management</h1>
      <p className="muted">Record ship arrivals, departures and dock information.</p>
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <form onSubmit={submit} className="card form grid-form">
          <h2>{editId ? 'Edit ship' : 'Add ship'}</h2>
          <label>Ship name<input value={form.name} onChange={set('name')} required /></label>
          <label>IMO number<input value={form.imo} onChange={set('imo')} required /></label>
          <label>Company<input value={form.company} onChange={set('company')} required /></label>
          <label>Arrival date<input type="date" value={form.arrivalDate} onChange={set('arrivalDate')} required /></label>
          <label>Departure date<input type="date" value={form.departureDate} onChange={set('departureDate')} required /></label>
          <label>Dock number<input value={form.dockNumber} onChange={set('dockNumber')} required /></label>
          <label>Status
            <select value={form.status} onChange={set('status')}>
              <option>Expected</option><option>Arrived</option><option>Departed</option>
            </select>
          </label>
          <div className="row">
            <button className="btn primary">{editId ? 'Update ship' : 'Add ship'}</button>
            {editId && <button type="button" className="btn ghost" onClick={() => { setForm(EMPTY); setEditId(null) }}>Cancel</button>}
          </div>
        </form>
      )}

      <div className="card">
        <h2>Ships</h2>
        {loading && <p>Loading…</p>}
        {!loading && ships.length === 0 && <p className="muted">No ships added yet.</p>}
        {ships.map((ship) => (
          <div key={ship._id} className="list-row">
            <div>
              <strong>{ship.name}</strong>
              <small>{ship.imo} · {ship.company} · {ship.dockNumber}</small>
              <small>Arrival {toDateInput(ship.arrivalDate)} · Departure {toDateInput(ship.departureDate)}</small>
            </div>
            <div className="row">
              <span className={`pill ${ship.status.toLowerCase()}`}>{ship.status}</span>
              {isAdmin && <button className="btn small" onClick={() => edit(ship)}>Edit</button>}
              {isAdmin && <button className="btn small danger" onClick={() => remove(ship._id)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
