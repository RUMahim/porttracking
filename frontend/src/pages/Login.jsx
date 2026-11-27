import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'
import Logo from '../components/Logo'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo size={46} />
          <h1>PortTrack</h1>
        </div>
        <p className="muted">Container Cargo Tracking System for Import &amp; Export</p>
        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <label>Password</label>
          <span className="pw-wrap">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
        <p className="muted center">
          New importer/exporter? <Link to="/register">Register</Link>
        </p>
        <p className="muted center">
          <Link to="/track-public"><Search size={13} /> Track a shipment without login</Link> · <Link to="/welcome">Home</Link>
        </p>
      </div>
    </div>
  )
}
