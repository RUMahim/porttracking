import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Ship, PackageSearch, BellRing, ArrowRight } from 'lucide-react'
import Logo from '../components/Logo'
import StatusStepper from '../components/StatusStepper'
import api, { apiError } from '../api'
import { fmtDate, fmtWeight } from '../utils/format'

export default function Landing() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.get(`/track/${encodeURIComponent(query.trim())}`)
      setResult(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  const s = result?.shipment
  const c = result?.container

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">
          <Logo size={38} />
          <div>
            <strong>PortTrack</strong>
            <small>Container Cargo Tracking</small>
          </div>
        </div>
        <div className="links">
          <Link to="/track-public">Track</Link>
          <Link to="/login">Login</Link>
          <Link to="/register" className="btn primary small">Get started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Track every container,<br />from booking to delivery.</h1>
        <p>
          PortTrack gives port officials, importers and exporters one live view of ships,
          shipments and containers — no more phone calls and spreadsheets.
        </p>
        <form className="landing-track" onSubmit={search}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter tracking ID — e.g. PT-2026-1042"
          />
          <button className="btn primary" disabled={loading}>
            <Search size={16} /> {loading ? 'Searching…' : 'Track'}
          </button>
        </form>
        {error && <p style={{ color: '#fca5a5', marginTop: 14 }}>{error}</p>}
        {s && (
          <div className="landing-result">
            <div className="card" style={{ margin: 0 }}>
              <div className="list-row" style={{ borderBottom: 'none', paddingTop: 0 }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{s.trackingId}</strong>
                  <small>{s.goodsType} · {fmtWeight(c?.weight)} · {s.origin} → {s.destination}</small>
                  <small>Ship: {s.ship?.name || '—'}{s.ship?.arrivalDate ? ` · Arrives ${fmtDate(s.ship.arrivalDate)}` : ''}</small>
                </div>
                <span className="pill status">{c?.currentStatus || '—'}</span>
              </div>
              {c && <StatusStepper currentStatus={c.currentStatus} history={c.statusHistory} />}
              <p className="muted" style={{ marginBottom: 0 }}>
                Container {c?.containerId} · <Link to="/login">Login</Link> for full details and notifications.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <div className="stat-icon teal"><Ship size={20} /></div>
          <h3>Ship &amp; dock management</h3>
          <p>Port officials record arrivals, departures and dock assignments for every vessel in one register.</p>
        </div>
        <div className="feature-card">
          <div className="stat-icon navy"><PackageSearch size={20} /></div>
          <h3>Live container tracking</h3>
          <p>Follow each container through six stages — Booked, Loaded, In Transit, Arrived, Customs Clearance, Delivered.</p>
        </div>
        <div className="feature-card">
          <div className="stat-icon blue"><BellRing size={20} /></div>
          <h3>Status notifications</h3>
          <p>Importers and exporters are notified the moment their container status changes. No manual follow-ups.</p>
        </div>
      </section>

      <p className="landing-footer">PortTrack — Container Cargo Tracking System for Import &amp; Export · Chattogram · Mongla</p>
    </div>
  )
}
