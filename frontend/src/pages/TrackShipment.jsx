import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, PackageSearch, ArrowLeft } from 'lucide-react'
import api, { apiError } from '../api'
import Logo from '../components/Logo'
import StatusStepper from '../components/StatusStepper'
import { EmptyState } from '../components/Skeleton'
import { fmtDate, fmtWeight } from '../utils/format'

export default function TrackShipment({ publicMode = false }) {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (value) => {
    const q = (value ?? query).trim()
    if (!q) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const { data } = await api.get(`/track/${encodeURIComponent(q)}`)
      setResult(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const initial = params.get('q')
    if (initial) search(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = result?.shipment
  const c = result?.container

  const content = (
    <div>
      <h1>Track Shipment</h1>
      <p className="muted">Search by tracking ID or container ID.</p>
      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          search()
        }}
      >
        <div className="row">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PT-2026-1042" style={{ flex: 1 }} />
          <button className="btn primary" disabled={loading}><Search size={15} /> {loading ? 'Searching…' : 'Track'}</button>
        </div>
      </form>

      {error && (
        <div className="card">
          <EmptyState icon={PackageSearch} title="No shipment found" hint={error} />
        </div>
      )}

      {s && (
        <div className="card">
          <div className="list-row" style={{ borderBottom: 'none', paddingTop: 0 }}>
            <div>
              <strong style={{ fontSize: 18 }}>{s.trackingId}</strong> <span className={`pill ${s.type}`}>{s.type}</span>
              <small>{s.goodsType}{c ? ` · ${fmtWeight(c.weight)}` : ''}</small>
              <small>{s.origin} → {s.destination}</small>
              <small>Container {s.containerId}{s.ship ? ` · Ship ${s.ship.name} (${s.ship.dockNumber})` : ''}</small>
              {s.ship?.arrivalDate && <small>Ship arrival {fmtDate(s.ship.arrivalDate)} · Departure {fmtDate(s.ship.departureDate)}</small>}
            </div>
            {c && <span className="pill status">{c.currentStatus}</span>}
          </div>
          {c ? (
            <StatusStepper currentStatus={c.currentStatus} history={c.statusHistory} />
          ) : (
            <p className="muted">Container record not found for this shipment.</p>
          )}
        </div>
      )}
    </div>
  )

  if (!publicMode) return content
  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <Logo size={44} />
          <h1>PortTrack</h1>
        </div>
        <p className="muted center"><Link to="/welcome"><ArrowLeft size={13} /> Back to home</Link> · <Link to="/login">Login</Link></p>
        {content}
      </div>
    </div>
  )
}
