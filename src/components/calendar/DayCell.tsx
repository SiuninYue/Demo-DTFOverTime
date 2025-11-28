import { MouseEvent, TouchEvent, useState } from 'react'
import type { DaySchedule, ScheduleType } from '@/types/schedule'
import type { TimeRecord, DayType } from '@/types/timecard'

const typeLabels: Record<ScheduleType, string> = {
  work: 'Work',
  rest: 'Rest',
  off: 'Off',
  overtime_on_off_day: 'OT/Off',
  leave: 'Leave',
  public_holiday: 'PH',
  training: 'Training',
  support_incoming: 'Support In',
  support_outgoing: 'Support Out',
  co: 'CO',
  unknown: 'Unknown',
}

const typeColors: Record<ScheduleType, string> = {
  work: 'day-cell--work',
  rest: 'day-cell--rest',
  off: 'day-cell--off',
  overtime_on_off_day: 'day-cell--ot-off',
  leave: 'day-cell--leave',
  public_holiday: 'day-cell--ph',
  training: 'day-cell--training',
  support_incoming: 'day-cell--support',
  support_outgoing: 'day-cell--support',
  co: 'day-cell--co',
  unknown: 'day-cell--unknown',
}

const typeIcons: Record<ScheduleType, string> = {
  work: 'W',
  rest: 'R',
  off: 'O',
  overtime_on_off_day: 'OT',
  leave: 'LV',
  public_holiday: 'PH',
  training: 'TR',
  support_incoming: 'SI',
  support_outgoing: 'SO',
  co: 'CO',
  unknown: '-',
}

export type QuickAction = 'edit' | 'timecard' | 'history' | 'copy' | 'paste'

interface DayCellProps {
  date: string
  schedule?: DaySchedule
  timeRecord?: TimeRecord
  isCurrentMonth: boolean
  isToday?: boolean
  onSelect?: (date: string) => void
  onQuickAction?: (date: string, action: QuickAction) => void
}

const formatTimeRange = (entry?: DaySchedule) => {
  if (!entry) return ''
  const start = entry.plannedStartTime ?? '--'
  const end = entry.plannedEndTime ?? '--'
  if (!entry.plannedStartTime && !entry.plannedEndTime) {
    return ''
  }
  return `${start} -> ${end}`
}

const formatRecordRange = (record?: TimeRecord) => {
  if (!record) return ''
  const start = record.actualStartTime ?? '--'
  const end = record.actualEndTime ?? '--'
  if (!record.actualStartTime && !record.actualEndTime) {
    return ''
  }
  return `${start} -> ${end}${record.spansMidnight ? ' (overnight)' : ''}`
}

const timecardLabels: Record<DayType, string> = {
  NORMAL_WORK_DAY: 'Workday',
  REST_DAY: 'Rest Day',
  PUBLIC_HOLIDAY: 'Public Holiday',
  ANNUAL_LEAVE: 'Annual Leave',
  MEDICAL_LEAVE: 'Medical Leave',
  OFF_DAY: 'Off Day',
}

const dayTypeColors: Record<DayType, string> = {
  NORMAL_WORK_DAY: 'day-cell--work',
  REST_DAY: 'day-cell--rest',
  PUBLIC_HOLIDAY: 'day-cell--ph',
  ANNUAL_LEAVE: 'day-cell--leave',
  MEDICAL_LEAVE: 'day-cell--leave',
  OFF_DAY: 'day-cell--off',
}

const UNPAID_MC_TAG = '[UNPAID_MC]'
const UNPAID_LEAVE_TAG = '[UNPAID_LEAVE]'

function DayCell({
  date,
  schedule,
  timeRecord,
  isCurrentMonth,
  isToday = false,
  onSelect,
  onQuickAction,
}: DayCellProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isUnpaidRecord =
    timeRecord?.notes?.includes(UNPAID_MC_TAG) || timeRecord?.notes?.includes(UNPAID_LEAVE_TAG)
  const buildClassName = () => {
    const classes = ['day-cell']
    if (timeRecord) {
      classes.push(dayTypeColors[timeRecord.dayType] ?? 'day-cell--empty')
    } else {
      const scheduleClass = schedule ? typeColors[schedule.type] : 'day-cell--empty'
      classes.push(scheduleClass)
    }
    if (timeRecord) classes.push('day-cell--recorded')
    if (!isCurrentMonth) classes.push('day-cell--inactive')
    if (isToday) classes.push('day-cell--today')
    return classes.join(' ')
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!isCurrentMonth) return
    if (showMenu) {
      setShowMenu(false)
      return
    }
    onSelect?.(date)
  }

  const handleAction = (action: QuickAction) => {
    setShowMenu(false)
    onQuickAction?.(date, action)
  }

  return (
    <button
      type="button"
      className={buildClassName()}
      onClick={handleClick}
      onTouchStart={(event: TouchEvent<HTMLButtonElement>) => event.stopPropagation()}
      onTouchEnd={(event: TouchEvent<HTMLButtonElement>) => event.stopPropagation()}
      onTouchCancel={(event: TouchEvent<HTMLButtonElement>) => event.stopPropagation()}
      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
      onMouseUp={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
    >
      <div className="day-cell__header">
        <span>{date.split('-')[2]}</span>
        {schedule?.isStatutoryRestDay && <span className="badge badge--rest">REST</span>}
        {onQuickAction && (
          <span
            role="button"
            tabIndex={0}
            className="day-cell__menu-button"
            onClick={(event) => {
              event.stopPropagation()
              setShowMenu((current) => !current)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                setShowMenu((current) => !current)
              }
            }}
            aria-label="Open quick actions"
          >
            ...
          </span>
        )}
      </div>
      <div className="day-cell__body">
        <span className="day-cell__type">
          {timeRecord ? (
            <>
              <span className="day-cell__icon" aria-hidden>
                {timeRecord.dayType === 'NORMAL_WORK_DAY'
                  ? 'W'
                  : timeRecord.dayType === 'REST_DAY'
                  ? 'R'
                  : timeRecord.dayType === 'OFF_DAY'
                  ? 'O'
                  : timeRecord.dayType === 'PUBLIC_HOLIDAY'
                  ? 'PH'
                  : isUnpaidRecord
                  ? 'NP'
                  : '•'}
              </span>
              {isUnpaidRecord ? 'Unpaid leave' : timecardLabels[timeRecord.dayType]}
            </>
          ) : schedule ? (
            <>
              <span className="day-cell__icon" aria-hidden>
                {typeIcons[schedule.type]}
              </span>
              {typeLabels[schedule.type]}
            </>
          ) : (
            'No entry'
          )}
        </span>
        {timeRecord && (
          <span className="day-cell__time">
            {formatRecordRange(timeRecord) || 'Recorded timecard'}
          </span>
        )}
        {!timeRecord && schedule && <span className="day-cell__time">{formatTimeRange(schedule)}</span>}
        {!schedule && !timeRecord && (
          <span className="day-cell__time">Add roster or open timecard</span>
        )}
      </div>
      {showMenu && onQuickAction && (
        <div className="day-cell-menu">
          <button type="button" onClick={() => handleAction('edit')}>
            Modify Schedule
          </button>
          <button type="button" onClick={() => handleAction('timecard')}>
            Record Timecard
          </button>
          <button type="button" onClick={() => handleAction('history')}>
            View History
          </button>
          <button type="button" onClick={() => handleAction('copy')}>
            Copy Details
          </button>
          <button type="button" onClick={() => handleAction('paste')}>
            Paste Details
          </button>
        </div>
      )}
    </button>
  )
}

export default DayCell
