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
      setError('Select a date for this MC entry.')
      return
    }
    if (formState.date < bounds.min || formState.date > bounds.max) {
      setError('Date must be within the selected month.')
      return
    }
    if (!Number.isFinite(formState.days) || formState.days <= 0) {
      setError('MC days must be at least 1 day.')
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
        submitError instanceof Error ? submitError.message : 'Failed to add MC record.'
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
            <p className="label">Add MC record</p>
            <h3>Capture medical leave</h3>
          </div>
          <button type="button" className="ghost" onClick={onClose} disabled={isSubmitting}>
            Close
          </button>
        </div>

        {error && <p className="upload-error">⚠️ {error}</p>}

        <form onSubmit={handleSubmit} className="mc-form">
          <label>
            <span>Date</span>
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
            <span>Days covered</span>
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
            <span>Certificate number (optional)</span>
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
            <span>Reason / clinic note</span>
            <textarea
              value={formState.reason}
              onChange={(event) =>
                setFormState((state) => ({ ...state, reason: event.target.value }))
              }
              rows={3}
              placeholder="e.g., Flu with fever"
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
            <span>Paid MC (uncheck for no-pay / unpaid leave)</span>
          </label>

          <div className="modal-card__actions">
            <button type="submit" className="secondary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save MC record'}
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
            <p className="label">Delete MC record</p>
            <h3>Are you sure?</h3>
          </div>
        </div>
        <p className="text-muted">删除后勤工奖将重新计算。确定要删除这条MC记录吗？</p>
        <div className="modal-card__actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddMCModal
