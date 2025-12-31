import { useMemo, useRef, type TouchEvent } from 'react'
import WeekDayCard from './WeekDayCard'
import type { Schedule } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'
import { getWeekDates, formatISODate } from '@/utils/dateUtils'

interface WeekCalendarProps {
  weekStart: string
  schedule?: Schedule | null
  timeRecords?: Record<string, TimeRecord>
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  onWeekChange?: (direction: 'prev' | 'next') => void
}

const getTodayKey = () => {
  const now = new Date()
  return formatISODate(now)
}

function WeekCalendar({
  weekStart,
  schedule,
  timeRecords,
  selectedDate,
  onSelectDate,
  onWeekChange,
}: WeekCalendarProps) {
  const weekStartDate = new Date(weekStart)
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStart])
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

    // 提高横向滑动阈值到 80px，避免与垂直滚动冲突
    if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        onWeekChange?.('next')
      } else {
        onWeekChange?.('prev')
      }
    }
    swipeOrigin.current = null
  }

  return (
    <div
      className="week-calendar"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeOrigin.current = null
      }}
    >
      {weekDates.map((date) => {
        const dateKey = formatISODate(date)
        return (
          <WeekDayCard
            key={dateKey}
            date={dateKey}
            schedule={data[dateKey]}
            timeRecord={timeRecords?.[dateKey]}
            isToday={dateKey === todayKey}
            onSelect={onSelectDate}
          />
        )
      })}
    </div>
  )
}

export default WeekCalendar
