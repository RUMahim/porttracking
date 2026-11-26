import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { apiError } from '../api'
import StatusStepper from '../components/StatusStepper'

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

  const content = (
    <div>
      <h1>Track Shipment</h1>
      <p className="muted">Search by tracking ID (e.g. PT-2026-1042) or container ID.</p>
      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          search()
        }}
      >
        <div className="row">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PT-2026-1042" />
          <button className="btn primary" disabled={loading}>{loading ? 'Searching…' : 'Track'}</button>
        </div>
        <p className="muted">Try demo ID: <button type="button" className="link-btn" onClick={() => { setQuery('PT-2026-1042'); search('PT-2026-1042') }}>PT-2026-1042</button></p>
      </form>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="card">
          <h2>{result.shipment.trackingId} <span className={`pill ${result.shipment.type}`}>{result.shipment.type}</span></h2>
          <p><strong>Goods:</strong> {result.shipment.goodsType}</p>
          <p><strong>Route:</strong> {result.shipment.origin} → {result.shipment.destination}</p>
          <p><strong>Container:</strong> {result.shipment.containerId}{result.container ? ` · ${result.container.weight} kg` : ''}</p>
          {result.shipment.ship && <p><strong>Ship:</strong> {result.shipment.ship.name} · {result.shipment.ship.dockNumber}</p>}
          {result.container && (
            <>
              <p><strong>Current status:</strong> {result.container.currentStatus}</p>
              <StatusStepper currentStatus={result.container.currentStatus} history={result.container.statusHistory} />
            </>
          )}
        </div>
      )}
    </div>
  )

  if (!publicMode) return content
  return (
    <div className="auth-page wide">
      <div className="auth-card wide">
        <p className="muted center"><Link to="/login">← Back to login</Link></p>
        {content}
      </div>
    </div>
  )
}
