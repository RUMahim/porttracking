import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users as UsersIcon, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { Modal, ConfirmModal } from '../components/Modal'
import { SkeletonRows, EmptyState } from '../components/Skeleton'
import { fmtDate } from '../utils/format'

export default function Users() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/users', { params: { all: 1 } })
      setUsers(data)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  if (!isAdmin) return <Navigate to="/" replace />

  const submitReset = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.put(`/users/${resetTarget._id}/password`, { password: newPassword })
      toast.success(`Password updated for ${resetTarget.email}`)
      setResetTarget(null)
      setNewPassword('')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/users/${confirmDelete._id}`)
      toast.success('User deleted')
      setConfirmDelete(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="muted">Importer, exporter and admin accounts. Reset passwords for users who are locked out. {users.length} accounts.</p>
        </div>
      </div>
      {error && !resetTarget && <p className="error">{error}</p>}

      {loading ? (
        <SkeletonRows />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState icon={UsersIcon} title="No users yet" hint="Accounts created through registration will appear here." />
        </div>
      ) : (
        <div className="card table-wrap" style={{ padding: 6 }}>
          <table className="data">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong>{u._id === user?._id && <span className="sub">You</span>}</td>
                  <td>{u.email}</td>
                  <td><span className={`pill ${u.role}`}>{u.role}</span></td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small" onClick={() => { setResetTarget(u); setError('') }}><KeyRound size={13} /> Reset password</button>
                      {u.role !== 'admin' && (
                        <button className="btn small danger" onClick={() => setConfirmDelete(u)}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetTarget && (
        <Modal title="Reset password" onClose={() => setResetTarget(null)}>
          <p className="muted">Set a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email}). They can sign in with it immediately.</p>
          <form onSubmit={submitReset} className="form">
            <label>New password
              <span className="pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
              <span className="hint">At least 6 characters.</span>
            </label>
            {error && <p className="error">{error}</p>}
            <div className="row end">
              <button type="button" className="btn" onClick={() => setResetTarget(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Set password'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete user?"
          message={`Account ${confirmDelete.email} will be permanently deleted. Their shipments will remain in the system.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
