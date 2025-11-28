import type { MCRecord } from '@/services/supabase/mcRecords'
import { formatDate } from '@/utils/formatting'

interface MCRecordListProps {
  records: MCRecord[]
  isLoading?: boolean
  onDelete?: (record: MCRecord) => void
  disabled?: boolean
}

function MCRecordList({ records, isLoading, onDelete, disabled }: MCRecordListProps) {
  if (isLoading) {
    return (
      <section className="mc-card">
        <h3>MC records</h3>
        <p className="text-muted">Loading MC history…</p>
      </section>
    )
  }

  return (
    <section className="mc-card">
      <header className="mc-card__header">
        <div>
          <p className="label">MC records</p>
          <h3>{records.length} entries</h3>
        </div>
      </header>
      {!records.length && <p className="empty-state">No MC entries this month.</p>}
      <ul className="mc-record-list">
        {records.map((record) => (
          <li key={record.id}>
            <div>
              <p className="mc-record-list__date">{formatDate(record.date, { format: 'medium' })}</p>
              <small className="text-muted">
                {record.days} day{record.days > 1 ? 's' : ''}
                {record.certificateNumber && ` · ${record.certificateNumber}`}
              </small>
              {record.reason && <p className="mc-record-list__reason">{record.reason}</p>}
            </div>
            {onDelete && (
              <button
                type="button"
                className="ghost"
                onClick={() => onDelete(record)}
                disabled={disabled}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MCRecordList
