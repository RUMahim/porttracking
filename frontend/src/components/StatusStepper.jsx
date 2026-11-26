export const STATUS_STEPS = [
  'Booked',
  'Loaded',
  'In Transit',
  'Arrived at Port',
  'Customs Clearance',
  'Delivered',
]

export default function StatusStepper({ currentStatus, history = [] }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus)
  const dateFor = (step) => {
    const entry = [...history].reverse().find((h) => h.status === step)
    return entry ? new Date(entry.date).toLocaleDateString() : ''
  }
  return (
    <div className="stepper">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className={`step ${i <= currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`}>
          <div className="step-dot">{i < currentIndex ? '✓' : i + 1}</div>
          <div className="step-label">{step}</div>
          <div className="step-date">{dateFor(step)}</div>
        </div>
      ))}
    </div>
  )
}
