import { Check } from 'lucide-react'
import { fmtDate } from '../utils/format'

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
    return entry ? fmtDate(entry.date) : ''
  }
  return (
    <div className="stepper">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className={`step ${i <= currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`}>
          <div className="step-dot">{i < currentIndex ? <Check size={14} /> : i + 1}</div>
          <div className="step-label">{step}</div>
          <div className="step-date">{dateFor(step)}</div>
        </div>
      ))}
    </div>
  )
}
