import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'
import Logo from '../components/Logo'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'importer' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form)
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
        <p className="muted">Create your account</p>
        <form onSubmit={submit} className="form">
          <label>Full name / Company</label>
          <input value={form.name} onChange={set('name')} placeholder="Rahim Traders" required />
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          <label>Password</label>
          <span className="pw-wrap">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 6 characters" required minLength={6} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          <span className="hint">Minimum 6 characters.</span>
          <label>Role</label>
          <select value={form.role} onChange={set('role')}>
            <option value="importer">Importer</option>
            <option value="exporter">Exporter</option>
            <option value="both">Importer &amp; Exporter (both)</option>
          </select>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
        <p className="muted center">Already have an account? <Link to="/login">Login</Link> · <Link to="/welcome">Home</Link></p>
      </div>
    </div>
  )
}
