import { useMemo, useRef, type TouchEvent } from 'react'
import DayCell, { type QuickAction } from './DayCell'
import type { Schedule } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'

interface MonthCalendarProps {
  month: string
  schedule?: Schedule | null
  timeRecords?: Record<string, TimeRecord>
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  onQuickAction?: (date: string, action: QuickAction) => void
  onMonthChange?: (direction: 'prev' | 'next') => void
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    <section
      className="calendar-panel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeOrigin.current = null
      }}
    >
      <header className="calendar-panel__header">
        <div>
          <p className="calendar-panel__label">Monthly Schedule</p>
          <h2>
            {year} / {String(monthPart).padStart(2, '0')}
          </h2>
        </div>
        <div className="calendar-panel__controls">
          <button type="button" className="ghost" onClick={() => onMonthChange?.('prev')}>
            Prev
          </button>
          <button type="button" className="ghost" onClick={() => onMonthChange?.('next')}>
            Next
          </button>
        </div>
      </header>
      <div className="calendar-grid">
        {weekdays.map((day) => (
          <div key={day} className="calendar-grid__weekday">
            {day}
          </div>
        ))}
        {days.map(({ date: dateKey, isCurrentMonth: isCurrent }, index) => (
          <div key={`${dateKey}-${index}`} className="calendar-grid__cell">
            <DayCell
              date={dateKey}
              schedule={data[dateKey]}
              timeRecord={timeRecords?.[dateKey]}
              isCurrentMonth={isCurrent}
              isToday={dateKey === todayKey}
              onSelect={onSelectDate}
              onQuickAction={onQuickAction}
            />
          </div>
        ))}
      </div>
      {selectedDate && data[selectedDate] && (
        <div className="calendar-selection">
          <p>
            Selected {selectedDate}: {data[selectedDate]?.notes || 'No notes'}
          </p>
        </div>
      )}
    </section>
  )
}

export default MonthCalendar
