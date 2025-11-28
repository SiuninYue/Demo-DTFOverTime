import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ScheduleType, type DaySchedule, type ScheduleData } from '@/types/schedule'
import { getDaysInMonth } from '@/utils/dateUtils'

const scheduleOptions = [
  { label: 'Work', value: ScheduleType.WORK },
  { label: 'Rest', value: ScheduleType.REST },
  { label: 'Off', value: ScheduleType.OFF },
  { label: 'PH', value: ScheduleType.PUBLIC_HOLIDAY },
]

const buildDefaultDay = (): DaySchedule => ({
  type: ScheduleType.WORK,
  plannedStartTime: '10:00',
  plannedEndTime: '19:00',
  isStatutoryRestDay: false,
  notes: '',
  isConfirmed: false,
})

const buildMonthTemplate = (month: string, data?: ScheduleData): ScheduleData => {
  if (data) {
    return { ...data }
  }

  const [year, monthPart] = month.split('-').map(Number)
  const totalDays = getDaysInMonth(Number.isNaN(year) ? new Date().getFullYear() : year, monthPart || 1)
  const template: ScheduleData = {}

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = `${month}-${String(day).padStart(2, '0')}`
    template[dateKey] = buildDefaultDay()
  }

  return template
}

interface ManualScheduleFormProps {
  month: string
  initialData?: ScheduleData
  isSaving?: boolean
  onSubmit?: (data: ScheduleData) => Promise<void> | void
  onChange?: (data: ScheduleData) => void
  disabled?: boolean
  disabledReason?: string | null
}

function ManualScheduleForm({
  month,
  initialData,
  isSaving = false,
  onSubmit,
  onChange,
  disabled = false,
  disabledReason = null,
}: ManualScheduleFormProps) {
  const [schedule, setSchedule] = useState<ScheduleData>(() =>
    buildMonthTemplate(month, initialData),
  )
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSchedule(buildMonthTemplate(month, initialData))
  }, [month, initialData])

  const dates = useMemo(() => Object.keys(schedule).sort(), [schedule])

  const handleDayChange = (date: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((current) => {
      const existing = current[date] ?? buildDefaultDay()
      const updated: ScheduleData = {
        ...current,
        [date]: {
          ...existing,
          [field]: value,
        },
      }
      onChange?.(updated)
      return updated
    })
  }

  const handleCopyPrevious = (date: string) => {
    const day = Number(date.split('-')[2])
    if (Number.isNaN(day) || day <= 1) {
      return
    }
    const prevDate = `${month}-${String(day - 1).padStart(2, '0')}`
    setSchedule((current) => {
      const previous = current[prevDate]
      if (!previous) {
        return current
      }
      const updated: ScheduleData = {
        ...current,
        [date]: {
          ...previous,
        },
      }
      onChange?.(updated)
      return updated
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmit) {
      return
    }

    try {
      setStatus('idle')
      setMessage(null)
      await onSubmit(schedule)
      setStatus('success')
      setMessage('Schedule saved. Future OCR enhancements will populate this grid automatically.')
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Failed to save schedule. Please retry later.',
      )
    }
  }

  return (
    <section className="manual-schedule">
      <header>
        <h2>Manual Schedule Entry</h2>
        <p className="text-muted">
          Complete the table below after uploading the roster. You can copy the previous entry to
          speed up repetitive shifts.
        </p>
      </header>

      {message && (
        <p className={status === 'error' ? 'upload-error' : 'text-success'}>
          {status === 'error' ? '⚠️ ' : '✅ '}
          {message}
        </p>
      )}
      {disabled && disabledReason && <p className="offline-banner">{disabledReason}</p>}

      <form onSubmit={handleSubmit}>
        <div className="table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th style={{ width: '8rem' }}>Date</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Rest Day</th>
                <th>Notes</th>
                <th>Tools</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((dateKey) => {
                const entry = schedule[dateKey] ?? buildDefaultDay()
                return (
                  <tr key={dateKey}>
                    <td>{dateKey}</td>
                    <td>
                      <select
                        value={entry.type}
                        onChange={(event) => handleDayChange(dateKey, 'type', event.target.value)}
                        disabled={disabled || isSaving}
                      >
                        {scheduleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry.plannedStartTime ?? ''}
                        onChange={(event) =>
                          handleDayChange(dateKey, 'plannedStartTime', event.target.value)
                        }
                        disabled={disabled || isSaving}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry.plannedEndTime ?? ''}
                        onChange={(event) =>
                          handleDayChange(dateKey, 'plannedEndTime', event.target.value)
                        }
                        disabled={disabled || isSaving}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={entry.isStatutoryRestDay}
                        onChange={(event) =>
                          handleDayChange(dateKey, 'isStatutoryRestDay', event.target.checked)
                        }
                        disabled={disabled || isSaving}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={entry.notes ?? ''}
                        placeholder="Notes"
                        onChange={(event) => handleDayChange(dateKey, 'notes', event.target.value)}
                        disabled={disabled || isSaving}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleCopyPrevious(dateKey)}
                        disabled={disabled || isSaving}
                      >
                        Copy ↑
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <footer className="manual-actions">
          <button type="submit" disabled={disabled || isSaving}>
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
          <p className="text-muted">
            Coming soon: automatic OCR recognition (Phase B). For now, manual input keeps the salary
            engine accurate.
          </p>
        </footer>
      </form>
    </section>
  )
}

export default ManualScheduleForm
