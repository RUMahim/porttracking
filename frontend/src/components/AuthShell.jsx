import { Ship, Bell, Search } from 'lucide-react'
import Logo from './Logo'

// Split-screen shell for auth pages: brand panel (desktop) + form panel.
// On mobile the brand panel hides and the form sits in a card on the gradient.
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-side">
        <div className="auth-side-brand">
          <Logo size={40} />
          <strong>PortTrack</strong>
        </div>
        <div className="auth-side-mid">
          <h2>Track every container, from booking to delivery.</h2>
          <ul className="auth-features">
            <li><span><Ship size={17} /></span> Ship &amp; dock management</li>
            <li><span><Search size={17} /></span> Live tracking by tracking ID</li>
            <li><span><Bell size={17} /></span> Instant status notifications</li>
          </ul>
        </div>
        <p className="auth-side-foot">Container Cargo Tracking System · Chattogram · Mongla</p>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Logo size={44} />
            <strong>PortTrack</strong>
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}
