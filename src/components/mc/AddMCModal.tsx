import { FormEvent, MouseEvent, useMemo, useState } from 'react'
import type { NewMcRecordInput } from '@/hooks/useMC'
import { getDaysInMonth } from '@/utils/dateUtils'

const buildBounds = (month: string) => {
  const [yearPart, monthPart] = month.split('-').map(Number)
  const now = new Date()
  const year = Number.isFinite(yearPart) ? yearPart : now.getUTCFullYear()
  const monthIndex = Number.isFinite(monthPart) ? monthPart : now.getUTCMonth() + 1
  const daysInMonth = getDaysInMonth(year, monthIndex)
  const paddedMonth = String(monthIndex).padStart(2, '0')
  return {
    min: `${year}-${paddedMonth}-01`,
    max: `${year}-${paddedMonth}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

const clampDate = (value: string, min: string, max: string): string => {
  if (value < min) return min
  if (value > max) return max
  return value
}

interface AddMCModalProps {
  isOpen: boolean
  month: string
  defaultDate?: string
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: NewMcRecordInput) => Promise<void> | void
}

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  isProcessing?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const initialState = {
  date: '',
  days: 1,
  certificateNumber: '',
  reason: '',
  isPaid: true,
}

function AddMCModal(props: AddMCModalProps) {
  if (!props.isOpen) {
    return null
  }
  const { month, defaultDate } = props
  // Force inner component to remount when month/defaultDate changes so initial state resets naturally
  const contentKey = `${month}-${defaultDate ?? 'today'}`
  return <AddMCModalContent key={contentKey} {...props} />
}

type AddMCModalContentProps = Omit<AddMCModalProps, 'isOpen'>

function AddMCModalContent({
  month,
  defaultDate,
  isSubmitting,
  onClose,
  onSubmit,
}: AddMCModalContentProps) {
  const bounds = useMemo(() => buildBounds(month), [month])
  const defaultDateValue = defaultDate ?? bounds.min
  const initialDate = useMemo(
    () => clampDate(defaultDateValue, bounds.min, bounds.max),
    [bounds.max, bounds.min, defaultDateValue],
  )
  const [formState, setFormState] = useState({ ...initialState, date: initialDate })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.date) {
      setError('请选择病假日期。')
      return
    }
    if (formState.date < bounds.min || formState.date > bounds.max) {
      setError('日期必须在所选月份内。')
      return
    }
    if (!Number.isFinite(formState.days) || formState.days <= 0) {
      setError('病假天数至少为 1 天。')
      return
    }

    const payload: NewMcRecordInput = {
      date: formState.date,
      days: Math.round(formState.days),
      certificateNumber: formState.certificateNumber.trim() || null,
      reason: formState.reason.trim() || null,
      isPaid: formState.isPaid,
    }

    try {
      await onSubmit(payload)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : '新增病假记录失败。'
      setError(message)
    }
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="modal-card" role="document">
        <div className="modal-card__header">
          <div>
            <p className="label">新增病假记录</p>
            <h3>记录病假</h3>
          </div>
          <button type="button" className="ghost" onClick={onClose} disabled={isSubmitting}>
            关闭
          </button>
        </div>

        {error && <p className="upload-error">⚠️ {error}</p>}

        <form onSubmit={handleSubmit} className="mc-form">
          <label>
            <span>日期</span>
            <input
              type="date"
              value={formState.date}
              min={bounds.min}
              max={bounds.max}
              onChange={(event) => setFormState((state) => ({ ...state, date: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>天数</span>
            <input
              type="number"
              min={1}
              step={1}
              value={formState.days}
              onChange={(event) =>
                setFormState((state) => ({ ...state, days: Number(event.target.value) }))
              }
              required
            />
          </label>
          <label>
            <span>证明编号（可选）</span>
            <input
              type="text"
              value={formState.certificateNumber}
              onChange={(event) =>
                setFormState((state) => ({ ...state, certificateNumber: event.target.value }))
              }
              placeholder="MC20251018"
            />
          </label>
          <label>
            <span>原因 / 诊所备注</span>
            <textarea
              value={formState.reason}
              onChange={(event) =>
                setFormState((state) => ({ ...state, reason: event.target.value }))
              }
              rows={3}
              placeholder="例如：发烧流感"
            />
          </label>
          <label className="mc-checkbox">
            <input
              type="checkbox"
              checked={formState.isPaid}
              onChange={(event) =>
                setFormState((state) => ({ ...state, isPaid: event.target.checked }))
              }
            />
            <span>带薪病假（取消勾选则为不带薪）</span>
          </label>

          <div className="modal-card__actions">
            <button type="submit" className="secondary" disabled={isSubmitting}>
              {isSubmitting ? '保存中…' : '保存病假记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ConfirmDeleteDialog({
  isOpen,
  isProcessing,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-card__header">
          <div>
            <p className="label">删除病假记录</p>
            <h3>确认删除？</h3>
          </div>
        </div>
        <p className="text-muted">删除后勤工奖将重新计算。确定要删除这条MC记录吗？</p>
        <div className="modal-card__actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={isProcessing}>
            取消
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? '删除中…' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddMCModal
