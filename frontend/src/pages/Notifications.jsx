import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Search } from 'lucide-react'
import api, { apiError } from '../api'
import { useToast } from '../components/Toast'
import { SkeletonRows, EmptyState } from '../components/Skeleton'
import { fmtDateTime } from '../utils/format'

export default function Notifications() {
  const toast = useToast()
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
    try {
      await api.put(`/notifications/${id}/read`)
      load()
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all')
      toast.success('All notifications marked as read')
      load()
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Notifications {unread > 0 && <span className="badge">{unread}</span>}</h1>
          <p className="muted">You are notified whenever your container status changes.</p>
        </div>
        {unread > 0 && (
          <button className="btn primary small" onClick={markAll}><CheckCheck size={15} /> Mark all as read</button>
        )}
      </div>
      {error && <p className="error">{error}</p>}

      {loading ? (
        <SkeletonRows />
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="No notifications yet" hint="Status updates for your containers will appear here." />
        </div>
      ) : (
        <div className="card">
          {notifications.map((n) => (
            <div key={n._id} className={`list-row ${n.isRead ? '' : 'unread'}`}>
              <div>
                <strong>{n.title}</strong>
                <small>{n.message}</small>
                <small>{fmtDateTime(n.createdAt)}</small>
              </div>
              <div className="row">
                {n.trackingId && <Link className="btn small" to={`/track?q=${encodeURIComponent(n.trackingId)}`}><Search size={13} /> Track</Link>}
                {!n.isRead && <button className="btn small" onClick={() => markRead(n._id)}><Check size={13} /> Mark read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
