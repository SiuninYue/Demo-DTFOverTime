import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Copy, ClipboardPaste } from 'lucide-react'
import { ScheduleType, type DaySchedule, type ScheduleData } from '@/types/schedule'
import { getDaysInMonth } from '@/utils/dateUtils'
import { useUserStore } from '@/store/userStore'

import { isPublicHoliday } from '@/utils/holidays'

const scheduleOptions = [
  { label: '早班 (Work)', value: ScheduleType.WORK },
  { label: '例休 (Rest)', value: ScheduleType.REST },
  { label: '空场 (Off)', value: ScheduleType.OFF },
  { label: '公假 (PH)', value: ScheduleType.PUBLIC_HOLIDAY },
  { label: '年假 (Leave)', value: ScheduleType.LEAVE },
]

const buildDefaultDay = (
  defaultStartTime?: string,
  defaultEndTime?: string,
): DaySchedule => ({
  type: ScheduleType.WORK,
  plannedStartTime: defaultStartTime || '10:00',
  plannedEndTime: defaultEndTime || '19:00',
  isStatutoryRestDay: true,
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
  const userProfile = useUserStore((state) => state.profile)
  const defaultStartTime = userProfile?.defaultStartTime
  const defaultEndTime = userProfile?.defaultEndTime

  const [schedule, setSchedule] = useState<ScheduleData>(initialData ?? {})
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [clipboard, setClipboard] = useState<DaySchedule | null>(null)

  useEffect(() => {
    if (initialData) {
      setSchedule(initialData)
    } else {
      // If no initialData, generate an empty schedule for the month
      const [year, monthPart] = month.split('-').map(Number);
      const totalDays = getDaysInMonth(Number.isNaN(year) ? new Date().getFullYear() : year, monthPart || 1);
      const emptySchedule: ScheduleData = {};
      for (let day = 1; day <= totalDays; day += 1) {
        const dateKey = `${month}-${String(day).padStart(2, '0')}`;
        emptySchedule[dateKey] = buildDefaultDay(defaultStartTime, defaultEndTime); // Pre-fill with defaults
      }
      setSchedule(emptySchedule);
    }
  }, [month, initialData, defaultStartTime, defaultEndTime])

  const dates = useMemo(() => {
    const [year, monthPart] = month.split('-').map(Number);
    const totalDays = getDaysInMonth(Number.isNaN(year) ? new Date().getFullYear() : year, monthPart || 1);
    const dateKeys: string[] = [];
    for (let day = 1; day <= totalDays; day += 1) {
      dateKeys.push(`${month}-${String(day).padStart(2, '0')}`);
    }
    return dateKeys;
  }, [month]);


  const handleDayChange = (date: string, field: keyof DaySchedule, value: string | boolean | null) => {
    setSchedule((current) => {
      const existing = current[date] ?? buildDefaultDay(defaultStartTime, defaultEndTime)
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

  const handleCopy = (entry: DaySchedule) => {
    setClipboard({ ...entry })
  }

  const handlePaste = (targetDate: string) => {
    if (!clipboard) return

    setSchedule((prev) => {
      const updated: ScheduleData = {
        ...prev,
        [targetDate]: {
          ...clipboard,
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
      setMessage('Schedule saved successfully.')
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Failed to save schedule. Please retry later.',
      )
    }
  }

  return (
    <section className="manual-schedule">
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
                <th className="w-24">日期</th>
                <th>类型</th>
                <th>开始</th>
                <th>结束</th>
                <th className="text-center">法定休</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((dateKey) => {
                const entry = schedule[dateKey] ?? buildDefaultDay(defaultStartTime, defaultEndTime)
                const dateObj = new Date(dateKey)
                const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                const isPH = isPublicHoliday(dateKey)

                let rowClass = 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                if (isPH) rowClass = 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                else if (isWeekend) rowClass = 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'

                // Weekday label in Chinese
                const weekdays = ['日', '一', '二', '三', '四', '五', '六']
                const weekdayLabel = weekdays[dayOfWeek]

                return (
                  <tr key={dateKey} className={rowClass}>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{dateKey}</span>
                        <span className="text-xs text-muted-foreground opacity-70">
                          周{weekdayLabel} {isPH ? '(公假)' : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={entry.type}
                        onChange={(event) => handleDayChange(dateKey, 'type', event.target.value)}
                        disabled={disabled || isSaving}
                        className="text-sm"
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
                        className="text-sm w-full min-w-[5rem]"
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
                        className="text-sm w-full min-w-[5rem]"
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
                        className="w-4 h-4 accent-brand-600"
                        title="Is statutory rest day?"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={entry.notes ?? ''}
                        placeholder="备注..."
                        onChange={(event) => handleDayChange(dateKey, 'notes', event.target.value)}
                        disabled={disabled || isSaving}
                        className="text-sm w-full min-w-[6rem]"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                          onClick={() => handleCopy(entry)}
                          disabled={disabled || isSaving}
                          title="复制 (Copy)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`p-1.5 rounded transition ${clipboard ? 'text-neutral-500 hover:text-brand-600 hover:bg-brand-50' : 'text-neutral-300 cursor-not-allowed'}`}
                          onClick={() => handlePaste(dateKey)}
                          disabled={disabled || isSaving || !clipboard}
                          title={clipboard ? '粘贴 (Paste)' : '请先复制'}
                        >
                          <ClipboardPaste className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <footer className="manual-actions mt-6 flex justify-end">
          <button type="submit" disabled={disabled || isSaving} className="btn-primary">
            {isSaving ? '保存中...' : '保存排班 (Save Schedule)'}
          </button>
        </footer>
      </form>
    </section>
  )
}

export default ManualScheduleForm
