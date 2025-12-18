import type { DaySchedule } from '@/types/schedule'

interface DayDetailModalProps {
  date: string
  schedule?: DaySchedule
  isOpen: boolean
  onClose: () => void
  onViewImage?: () => void
  onEditSchedule?: (date: string) => void
  onRecordTimecard?: (date: string) => void
  onCopyDetails?: (date: string) => void
}

const describeSchedule = (entry?: DaySchedule) => {
  if (!entry) return 'No schedule recorded'
  return [
    entry.plannedStartTime && `Start: ${entry.plannedStartTime}`,
    entry.plannedEndTime && `End: ${entry.plannedEndTime}`,
    entry.notes && `Notes: ${entry.notes}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

const getWeekdayLabel = (date: string) => {
  const instance = new Date(`${date}T00:00:00`)
  return instance.toLocaleDateString('en-SG', { weekday: 'long' })
}

function DayDetailModal({
  date,
  schedule,
  isOpen,
  onClose,
  onViewImage,
  onEditSchedule,
  onRecordTimecard,
  onCopyDetails,
}: DayDetailModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Day details">
      <div className="modal-card">
        <header className="modal-card__header">
          <div>
            <p className="text-muted">Selected date</p>
            <h3>
              {date} · {getWeekdayLabel(date)}
            </h3>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="modal-card__body">
          <p>
            <strong>Type:</strong> {schedule?.type ?? '—'}
          </p>
          <p>
            <strong>Details:</strong> {describeSchedule(schedule)}
          </p>
          {schedule?.isStatutoryRestDay && <p className="badge badge--rest">Statutory Rest Day</p>}
        </div>
        <div className="modal-card__actions">
          <button type="button" className="ghost" onClick={() => onCopyDetails?.(date)}>
            Copy Details
          </button>
          <button type="button" className="ghost" onClick={() => onPasteDetails?.(date)}>
            Paste Details
          </button>
          <button type="button" className="ghost" onClick={() => onEditSchedule?.(date)}>
            Modify Schedule
          </button>
          <button type="button" className="ghost" onClick={() => onRecordTimecard?.(date)}>
            Record Timecard
          </button>
        </div>
        <footer className="modal-card__footer">
          <button type="button" className="secondary" onClick={onViewImage}>
            View Original Image
          </button>
          <button type="button" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}

export default DayDetailModal
