import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Search, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'
import AuthShell from '../components/AuthShell'
import { Modal } from '../components/Modal'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, remember)
      navigate('/')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your PortTrack account">
      <form onSubmit={submit} className="form auth-form">
        <label>Email</label>
        <span className="field">
          <Mail size={17} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </span>
        <label>Password</label>
        <span className="field pw-wrap">
          <Lock size={17} />
          <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Show password">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
        <div className="auth-row">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="link-btn" onClick={() => setShowForgot(true)}>Forgot password?</button>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block center" disabled={loading}>
          {loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="divider"><span>or</span></div>
      <Link to="/track-public" className="btn ghost block center">
        <Search size={16} /> Track a shipment without login
      </Link>

      <p className="muted center auth-alt">
        New importer/exporter? <Link to="/register">Create an account</Link>
      </p>
      <p className="muted center auth-home">
        <Link to="/welcome">← Back to home</Link>
      </p>

      {showForgot && (
        <Modal title="Forgot password?" onClose={() => setShowForgot(false)}>
          <p className="muted" style={{ textAlign: 'left' }}>
            Passwords are reset by the port office. Contact the PortTrack admin with your
            registered email — they can set a new password for you from the Users page,
            and you can change it again after signing in.
          </p>
          <div className="row end">
            <button className="btn primary" onClick={() => setShowForgot(false)}>Got it</button>
          </div>
        </Modal>
      )}
    </AuthShell>
  )
}
