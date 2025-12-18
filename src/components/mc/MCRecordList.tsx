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
        <h3>病假记录</h3>
        <p className="text-muted">正在加载病假记录…</p>
      </section>
    )
  }

  return (
    <section className="mc-card">
      <header className="mc-card__header">
        <div>
          <p className="label">病假记录</p>
          <h3>{records.length} 条</h3>
        </div>
      </header>
      {!records.length && <p className="empty-state">本月暂无病假记录。</p>}
      <ul className="mc-record-list">
        {records.map((record) => (
          <li key={record.id}>
            <div>
              <p className="mc-record-list__date">{formatDate(record.date, { format: 'medium' })}</p>
              <small className="text-muted">
                {record.days} 天
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
                删除
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MCRecordList
