import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiError } from '../api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnread(data.unreadCount)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    load()
  }

  const markAll = async () => {
    await api.put('/notifications/read-all')
    load()
  }

  return (
    <div>
      <h1>Notifications {unread > 0 && <span className="badge">{unread}</span>}</h1>
      <p className="muted">You are notified whenever your container status changes.</p>
      {error && <p className="error">{error}</p>}
      {unread > 0 && <button className="btn primary small" onClick={markAll}>Mark all as read</button>}
      <div className="card">
        {loading && <p>Loading…</p>}
        {!loading && notifications.length === 0 && <p className="muted">No notifications yet.</p>}
        {notifications.map((n) => (
          <div key={n._id} className={`list-row ${n.isRead ? '' : 'unread'}`}>
            <div>
              <strong>{n.title}</strong>
              <small>{n.message}</small>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            <div className="row">
              {n.trackingId && <Link className="btn small" to={`/track?q=${encodeURIComponent(n.trackingId)}`}>Track</Link>}
              {!n.isRead && <button className="btn small" onClick={() => markRead(n._id)}>Mark read</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
