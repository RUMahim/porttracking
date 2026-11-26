import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ship, Package, Container, Search, Bell, Users, LogOut, Menu, X,
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [quickTrack, setQuickTrack] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Near-real-time: poll the unread notification count every 30 seconds
  useEffect(() => {
    let alive = true
    const load = () =>
      api
        .get('/notifications')
        .then(({ data }) => {
          if (alive) setUnread(data.unreadCount || 0)
        })
        .catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/welcome')
  }

  const submitQuickTrack = (e) => {
    e.preventDefault()
    if (quickTrack.trim()) navigate(`/track?q=${encodeURIComponent(quickTrack.trim())}`)
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="layout">
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <Logo size={38} />
          <div>
            <strong>PortTrack</strong>
            <small>Container Cargo Tracking</small>
          </div>
          <button className="icon-btn sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="nav">
          <NavLink to="/" end><LayoutDashboard size={17} /> Dashboard</NavLink>
          <NavLink to="/ships"><Ship size={17} /> Ship Management</NavLink>
          <NavLink to="/shipments"><Package size={17} /> Shipment Management</NavLink>
          <NavLink to="/containers"><Container size={17} /> Containers</NavLink>
          <NavLink to="/track"><Search size={17} /> Track Shipment</NavLink>
          <NavLink to="/notifications">
            <Bell size={17} /> Notifications {unread > 0 && <span className="badge">{unread}</span>}
          </NavLink>
          {isAdmin && (
            <NavLink to="/users"><Users size={17} /> Users</NavLink>
          )}
        </nav>
        <div className="sidebar-user">
          <div>{user?.name}</div>
          <small>{user?.email} · {user?.role}</small>
          <button className="btn ghost" onClick={handleLogout}><LogOut size={15} /> Logout</button>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <form className="topbar-search" onSubmit={submitQuickTrack}>
            <Search size={16} />
            <input
              value={quickTrack}
              onChange={(e) => setQuickTrack(e.target.value)}
              placeholder="Track by ID or container…"
            />
          </form>
          <div className="topbar-actions">
            <Link to="/notifications" className="bell" aria-label="Notifications">
              <Bell size={19} />
              {unread > 0 && <span className="badge">{unread}</span>}
            </Link>
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <div className="who">
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
            </div>
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
        <footer className="footer">
          <span>PortTrack — Container Cargo Tracking System for Import &amp; Export</span>
          <span>Chattogram · Mongla</span>
        </footer>
      </div>
    </div>
  )
}
