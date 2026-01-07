import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Copy, ClipboardPaste } from 'lucide-react'
import { ScheduleType, type DaySchedule, type ScheduleData } from '@/types/schedule'
import { getDaysInMonth } from '@/utils/dateUtils'
import { useUserStore } from '@/store/userStore'
import type { TimeRecord } from '@/types/timecard'

import { isPublicHoliday } from '@/utils/holidays'
import ManualScheduleMobile from './ManualScheduleMobile'

const scheduleOptions = [
  { label: '早班', value: ScheduleType.WORK },
  { label: '例休', value: ScheduleType.REST },
  { label: '调休', value: ScheduleType.OFF },
  { label: '公假', value: ScheduleType.PUBLIC_HOLIDAY },
  { label: '年假', value: ScheduleType.LEAVE },
]

const buildDefaultDay = (
  defaultStartTime?: string,
  defaultEndTime?: string,
): DaySchedule => ({
  type: ScheduleType.WORK,
  plannedStartTime: defaultStartTime || '10:00',
  plannedEndTime: defaultEndTime || '19:00',
  isStatutoryRestDay: false,
  notes: '',
  isConfirmed: false,
})


const formatTimeValue = (value?: string | null) => {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

interface ManualScheduleFormProps {
  month: string
  initialData?: ScheduleData
  isSaving?: boolean
  onSubmit?: (data: ScheduleData) => Promise<void> | void
  onChange?: (data: ScheduleData) => void
  disabled?: boolean
  disabledReason?: string | null
  timeRecords?: Record<string, TimeRecord>
}

function ManualScheduleForm({
  month,
  initialData,
  isSaving = false,
  onSubmit,
  onChange,
  disabled = false,
  disabledReason = null,
  timeRecords,
}: ManualScheduleFormProps) {
  const userProfile = useUserStore((state) => state.profile)
  const defaultStartTime = userProfile?.defaultStartTime
  const defaultEndTime = userProfile?.defaultEndTime

  const [schedule, setSchedule] = useState<ScheduleData>(initialData ?? {})
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [clipboard, setClipboard] = useState<DaySchedule | null>(null)

  const computedSchedule = useMemo(() => {
    if (initialData) {
      return initialData
    }
    // If no initialData, generate an empty schedule for the month
    const [year, monthPart] = month.split('-').map(Number);
    const totalDays = getDaysInMonth(Number.isNaN(year) ? new Date().getFullYear() : year, monthPart || 1);
    const emptySchedule: ScheduleData = {};
    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${month}-${String(day).padStart(2, '0')}`;
      emptySchedule[dateKey] = buildDefaultDay(defaultStartTime, defaultEndTime);
    }
    return emptySchedule
  }, [month, initialData, defaultStartTime, defaultEndTime])

  useEffect(() => {
    setSchedule(computedSchedule)
  }, [computedSchedule])

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
      const shouldClearTimes =
        field === 'type' &&
        value !== ScheduleType.WORK &&
        value !== ScheduleType.OFF
      const shouldClearStatutory =
        field === 'type' &&
        value !== ScheduleType.REST &&
        value !== ScheduleType.OFF
      const updated: ScheduleData = {
        ...current,
        [date]: {
          ...existing,
          [field]: value,
          ...(shouldClearTimes
            ? { plannedStartTime: null, plannedEndTime: null }
            : null),
          ...(shouldClearStatutory
            ? { isStatutoryRestDay: false }
            : null),
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
      setMessage('排班已保存。')
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : '保存排班失败，请稍后重试。',
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

      <div className="block md:hidden">
        <ManualScheduleMobile
          month={month}
          schedule={schedule}
          onChange={(updated) => {
            setSchedule(updated)
            onChange?.(updated)
          }}
          disabled={disabled}
          timeRecords={timeRecords}
          isSaving={isSaving}
          onSubmit={disabled ? undefined : () => handleSubmit({ preventDefault: () => { } } as any)}
        />
      </div>

      <div className="hidden md:block">
        <form onSubmit={handleSubmit}>
          <div className="table-wrapper">
            {/* ... existing table code ... */}
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="w-14 schedule-date-cell">日期</th>
                  <th>类型</th>
                  <th>开始</th>
                  <th>结束</th>
                  <th
                    className="text-center"
                    title="法定休息日会影响加班与补休的计算方式"
                  >
                    法定休
                  </th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((dateKey) => {
                  const entry = schedule[dateKey] ?? buildDefaultDay(defaultStartTime, defaultEndTime)
                  const confirmedRecord = timeRecords?.[dateKey]
                  const isConfirmed = Boolean(confirmedRecord)
                  const isStatutoryApplicable =
                    entry.type === ScheduleType.REST || entry.type === ScheduleType.OFF
                  const canEditWorkTime =
                    entry.type === ScheduleType.WORK || entry.isStatutoryRestDay
                  const displayStartTime = formatTimeValue(
                    confirmedRecord?.actualStartTime ?? entry.plannedStartTime,
                  )
                  const displayEndTime = formatTimeValue(
                    confirmedRecord?.actualEndTime ?? entry.plannedEndTime,
                  )
                  const dateObj = new Date(dateKey)
                  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                  const isPH = isPublicHoliday(dateKey)
                  const isRowDisabled = disabled || isSaving || isConfirmed

                  let rowClass = 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  if (isPH) rowClass = 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                  else if (isWeekend) rowClass = 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'
                  if (isConfirmed) rowClass = `${rowClass} schedule-row--confirmed`

                  // Weekday label in Chinese
                  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
                  const weekdayLabel = weekdays[dayOfWeek]

                  return (
                    <tr key={dateKey} className={rowClass}>
                      <td className="whitespace-nowrap schedule-date-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{dateKey.slice(5)}</span>
                          <span className="text-xs text-muted-foreground opacity-70">
                            周{weekdayLabel} {isPH ? '(公假)' : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <select
                          value={entry.type}
                          onChange={(event) => handleDayChange(dateKey, 'type', event.target.value)}
                          disabled={isRowDisabled}
                          className="text-sm schedule-type-select"
                        >
                          {scheduleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {canEditWorkTime ? (
                          <input
                            type="time"
                            value={displayStartTime}
                            onChange={(event) =>
                              handleDayChange(dateKey, 'plannedStartTime', event.target.value)
                            }
                            disabled={isRowDisabled}
                            className="text-sm w-full min-w-[5rem]"
                          />
                        ) : (
                          <span className="time-placeholder">--:--</span>
                        )}
                      </td>
                      <td>
                        {canEditWorkTime ? (
                          <input
                            type="time"
                            value={displayEndTime}
                            onChange={(event) =>
                              handleDayChange(dateKey, 'plannedEndTime', event.target.value)
                            }
                            disabled={isRowDisabled}
                            className="text-sm w-full min-w-[5rem]"
                          />
                        ) : (
                          <span className="time-placeholder">--:--</span>
                        )}
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={entry.isStatutoryRestDay}
                          onChange={(event) =>
                            handleDayChange(dateKey, 'isStatutoryRestDay', event.target.checked)
                          }
                          disabled={isRowDisabled || !isStatutoryApplicable}
                          className="w-4 h-4 accent-brand-600"
                          title="是否法定休息日"
                        />
                      </td>
                      <td>
                        <div className="schedule-notes">
                          {isConfirmed ? (
                            <span className="schedule-confirmed-tag">已确认</span>
                          ) : (
                            <input
                              type="text"
                              value={entry.notes ?? ''}
                              placeholder="备注"
                              onChange={(event) =>
                                handleDayChange(dateKey, 'notes', event.target.value)
                              }
                              disabled={isRowDisabled}
                              maxLength={20}
                              title={entry.notes ?? ''}
                              className="text-sm w-full min-w-[6rem]"
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                            onClick={() => handleCopy(entry)}
                            disabled={disabled || isSaving}
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className={`p-1.5 rounded transition ${clipboard ? 'text-neutral-500 hover:text-brand-600 hover:bg-brand-50' : 'text-neutral-300 cursor-not-allowed'}`}
                            onClick={() => handlePaste(dateKey)}
                            disabled={isRowDisabled || !clipboard}
                            title={clipboard ? '粘贴' : '请先复制'}
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
              {isSaving ? '保存中…' : '保存排班'}
            </button>
          </footer>
        </form>
      </div>
    </section>
  )
}

export default ManualScheduleForm
