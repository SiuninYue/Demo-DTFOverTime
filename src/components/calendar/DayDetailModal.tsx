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
  onPasteDetails?: (date: string) => void
}

const describeSchedule = (entry?: DaySchedule) => {
  if (!entry) return '未记录排班'
  return [
    entry.plannedStartTime && `开始：${entry.plannedStartTime}`,
    entry.plannedEndTime && `结束：${entry.plannedEndTime}`,
    entry.notes && `备注：${entry.notes}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

const getWeekdayLabel = (date: string) => {
  const instance = new Date(`${date}T00:00:00`)
  return instance.toLocaleDateString('zh-SG', { weekday: 'long' })
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
  onPasteDetails,
}: DayDetailModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="日期详情">
      <div className="modal-card">
        <header className="modal-card__header">
          <div>
            <p className="text-muted">已选择日期</p>
            <h3>
              {date} · {getWeekdayLabel(date)}
            </h3>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="modal-card__body">
          <p>
            <strong>类型：</strong> {schedule?.type ?? '—'}
          </p>
          <p>
            <strong>详情：</strong> {describeSchedule(schedule)}
          </p>
          {schedule?.isStatutoryRestDay && <p className="badge badge--rest">法定休息日</p>}
        </div>
        <div className="modal-card__actions">
          <button type="button" className="ghost" onClick={() => onCopyDetails?.(date)}>
            复制详情
          </button>
          {onPasteDetails && (
            <button type="button" className="ghost" onClick={() => onPasteDetails(date)}>
              粘贴详情
            </button>
          )}
          <button type="button" className="ghost" onClick={() => onEditSchedule?.(date)}>
            修改排班
          </button>
          <button type="button" className="ghost" onClick={() => onRecordTimecard?.(date)}>
            记录打卡
          </button>
        </div>
        <footer className="modal-card__footer">
          <button type="button" className="secondary" onClick={onViewImage}>
            查看原始图片
          </button>
          <button type="button" onClick={onClose}>
            完成
          </button>
        </footer>
      </div>
    </div>
  )
}

export default DayDetailModal
