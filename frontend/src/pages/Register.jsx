import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'importer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
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
        <h1>⚓ PortTrack</h1>
        <p className="muted">Create an importer or exporter account</p>
        <form onSubmit={submit} className="form">
          <label>Full name / Company</label>
          <input value={form.name} onChange={set('name')} required />
          <label>Email</label>
          <input value={form.email} onChange={set('email')} required />
          <label>Password</label>
          <input type="password" value={form.password} onChange={set('password')} required />
          <label>Role</label>
          <select value={form.role} onChange={set('role')}>
            <option value="importer">Importer</option>
            <option value="exporter">Exporter</option>
          </select>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
        <p className="muted center">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}
