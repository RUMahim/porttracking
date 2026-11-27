import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'
import AuthShell from '../components/AuthShell'

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
    <AuthShell title="Create your account" subtitle="Start tracking your cargo in minutes">
      <form onSubmit={submit} className="form auth-form">
        <label>Full name / Company</label>
        <span className="field">
          <User size={17} />
          <input value={form.name} onChange={set('name')} placeholder="Rahim Traders" required />
        </span>
        <label>Email</label>
        <span className="field">
          <Mail size={17} />
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </span>
        <label>Password</label>
        <span className="field pw-wrap">
          <Lock size={17} />
          <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 6 characters" required minLength={6} />
          <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Show password">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
        <label>Role</label>
        <select value={form.role} onChange={set('role')}>
          <option value="importer">Importer</option>
          <option value="exporter">Exporter</option>
          <option value="both">Importer &amp; Exporter (both)</option>
        </select>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block center" disabled={loading}>
          {loading ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}
        </button>
      </form>
      <p className="muted center auth-alt">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <p className="muted center auth-home">
        <Link to="/welcome">← Back to home</Link>
      </p>
    </AuthShell>
  )
}
