import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    api
      .get('/notifications')
      .then(({ data }) => {
        if (alive) setUnread(data.unreadCount || 0)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚓</span>
          <div>
            <strong>PortTrack</strong>
            <small>Container Cargo Tracking</small>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/ships">Ship Management</NavLink>
          <NavLink to="/shipments">Shipment Management</NavLink>
          <NavLink to="/containers">Containers</NavLink>
          <NavLink to="/track">Track Shipment</NavLink>
          <NavLink to="/notifications">
            Notifications {unread > 0 && <span className="badge">{unread}</span>}
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div>{user?.name}</div>
          <small>{user?.email} · {user?.role}</small>
          <button className="btn ghost" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
