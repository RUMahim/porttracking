import { X, AlertTriangle } from 'lucide-react'

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal confirm" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <AlertTriangle size={22} />
        </div>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="row end">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
