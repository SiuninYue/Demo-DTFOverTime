import { useMemo, useRef, type TouchEvent } from 'react'
import DayCell, { type QuickAction } from './DayCell'
import DayCellCompact from './DayCellCompact'
import type { Schedule } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'
import { cn } from '@/lib/utils'

interface MonthCalendarProps {
  month: string
  schedule?: Schedule | null
  timeRecords?: Record<string, TimeRecord>
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  onQuickAction?: (date: string, action: QuickAction) => void
  onMonthChange?: (direction: 'prev' | 'next') => void
  compact?: boolean
}

const weekdays = [
  { key: 'sun', label: '日' },
  { key: 'mon', label: '一' },
  { key: 'tue', label: '二' },
  { key: 'wed', label: '三' },
  { key: 'thu', label: '四' },
  { key: 'fri', label: '五' },
  { key: 'sat', label: '六' },
]

const getDaysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate()

const formatISODate = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const buildCalendarMatrix = (year: number, monthIndex: number) => {
  const daysInMonth = getDaysInMonth(year, monthIndex)
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const dates: Array<{ date: string; isCurrentMonth: boolean }> = []

  for (let i = 0; i < firstDay; i += 1) {
    const prevDate = new Date(year, monthIndex, -(firstDay - (i + 1)))
    dates.push({
      date: formatISODate(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()),
      isCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push({
      date: formatISODate(year, monthIndex, day),
      isCurrentMonth: true,
    })
  }

  const remainder = dates.length % 7
  if (remainder !== 0) {
    for (let i = remainder; i < 7; i += 1) {
      const nextDate = new Date(year, monthIndex + 1, i - remainder + 1)
      dates.push({
        date: formatISODate(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate()),
        isCurrentMonth: false,
      })
    }
  }

  return dates
}

const getTodayKey = () => {
  const now = new Date()
  return formatISODate(now.getFullYear(), now.getMonth(), now.getDate())
}

function MonthCalendar({
  month,
  schedule,
  timeRecords,
  selectedDate,
  onSelectDate,
  onQuickAction,
  onMonthChange,
  compact = false,
}: MonthCalendarProps) {
  const [year, monthPart] = month.split('-').map(Number)
  const monthIndex = (monthPart ?? 1) - 1

  const days = useMemo(() => buildCalendarMatrix(year, monthIndex), [year, monthIndex])
  const data = schedule?.scheduleData ?? {}
  const todayKey = getTodayKey()
  const swipeOrigin = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      swipeOrigin.current = null
      return
    }
    const touch = event.touches[0]
    swipeOrigin.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!swipeOrigin.current || event.changedTouches.length !== 1) {
      return
    }
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - swipeOrigin.current.x
    const deltaY = touch.clientY - swipeOrigin.current.y
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        onMonthChange?.('next')
      } else {
        onMonthChange?.('prev')
      }
    }
    swipeOrigin.current = null
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeOrigin.current = null
      }}
    >
      <div className="calendar-grid">
        {weekdays.map((day, index) => (
          <div
            key={day.key}
            className={cn(
              'calendar-grid__weekday',
              index === 0 && 'calendar-grid__weekday--sun'
            )}
          >
            {day.label}
          </div>
        ))}
        {days.map(({ date: dateKey, isCurrentMonth: isCurrent }, index) => (
          <div key={`${dateKey}-${index}`} className="calendar-grid__cell">
            {compact ? (
              <DayCellCompact
                date={dateKey}
                schedule={data[dateKey]}
                timeRecord={timeRecords?.[dateKey]}
                isCurrentMonth={isCurrent}
                isToday={dateKey === todayKey}
                onSelect={onSelectDate}
              />
            ) : (
              <DayCell
                date={dateKey}
                schedule={data[dateKey]}
                timeRecord={timeRecords?.[dateKey]}
                isCurrentMonth={isCurrent}
                isToday={dateKey === todayKey}
                onSelect={onSelectDate}
                onQuickAction={onQuickAction}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthCalendar
