import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'

const DEMO = [
  { label: 'Admin / Port Officer', email: 'admin@porttrack.demo' },
  { label: 'Importer', email: 'importer@porttrack.demo' },
  { label: 'Exporter', email: 'exporter@porttrack.demo' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async (demoEmail) => {
    setError('')
    setLoading(true)
    try {
      await login(demoEmail, 'demo123')
      navigate('/')
    } catch (err) {
      setError(apiError(err) + ' — did you run npm run seed in backend?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>⚓ PortTrack</h1>
        <p className="muted">Container Cargo Tracking System for Import & Export</p>
        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
        <div className="demo-box">
          <strong>Demo logins (password: demo123)</strong>
          {DEMO.map((d) => (
            <button key={d.email} className="btn ghost block" disabled={loading} onClick={() => demoLogin(d.email)}>
              {d.label} — {d.email}
            </button>
          ))}
        </div>
        <p className="muted center">
          New importer/exporter? <Link to="/register">Register</Link> ·{' '}
          <Link to="/track-public">Track a shipment without login</Link>
        </p>
      </div>
    </div>
  )
}
