import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ship, Package, Container, Search, Bell, Users, LogOut, Menu, X,
  ChevronDown, KeyRound, Eye, EyeOff,
} from 'lucide-react'
import api, { apiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Modal } from './Modal'
import Logo from './Logo'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [quickTrack, setQuickTrack] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState('')
  const userMenuRef = useRef(null)

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close the user dropdown on outside click / Escape
  useEffect(() => {
    if (!userMenuOpen) return
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const submitChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirmation do not match')
      return
    }
    setPwBusy(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully')
      setShowPwModal(false)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(apiError(err))
    } finally {
      setPwBusy(false)
    }
  }

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
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="user-chip"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="avatar">{initials}</span>
                <span className="who">
                  <strong>{user?.name}</strong>
                  <small>{user?.role}</small>
                </span>
                <ChevronDown size={15} className={`chev ${userMenuOpen ? 'up' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-head">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                    <span className={`pill ${user?.role}`}>{user?.role}</span>
                  </div>
                  <Link to="/" className="user-menu-item"><LayoutDashboard size={15} /> Dashboard</Link>
                  <Link to="/notifications" className="user-menu-item">
                    <Bell size={15} /> Notifications {unread > 0 && <span className="badge">{unread}</span>}
                  </Link>
                  {isAdmin && (
                    <Link to="/users" className="user-menu-item"><Users size={15} /> Manage users</Link>
                  )}
                  <button
                    className="user-menu-item"
                    onClick={() => { setUserMenuOpen(false); setPwError(''); setShowPwModal(true) }}
                  >
                    <KeyRound size={15} /> Change password
                  </button>
                  <div className="user-menu-sep" />
                  <button className="user-menu-item danger" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
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

      {showPwModal && (
        <Modal title="Change password" onClose={() => setShowPwModal(false)}>
          <form onSubmit={submitChangePassword} className="form">
            <label>Current password
              <span className="pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <label>New password
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>
            <label>Confirm new password
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </label>
            {pwError && <p className="error">{pwError}</p>}
            <div className="row end">
              <button type="button" className="btn" onClick={() => setShowPwModal(false)}>Cancel</button>
              <button className="btn primary" disabled={pwBusy}>{pwBusy ? 'Saving…' : 'Change password'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
