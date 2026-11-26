export function SkeletonCards({ count = 4 }) {
  return (
    <div className="stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat skeleton-card">
          <div className="skel skel-num" />
          <div className="skel skel-line" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="card">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-row">
          <div className="skel skel-line wide" />
          <div className="skel skel-pill" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={26} />
        </div>
      )}
      <strong>{title}</strong>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  )
}
