import type { DaySchedule, ScheduleType } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'
import { cn } from '@/lib/utils'
import { getPublicHolidayName } from '@/utils/holidays'

// 排班类型对应的颜色（用于背景）
const typeBackgroundColors: Record<ScheduleType, string> = {
  work: 'bg-gray-200/30 dark:bg-gray-700/30',
  rest: 'bg-green-200/30 dark:bg-green-800/30',
  off: 'bg-slate-200/30 dark:bg-slate-700/30',
  overtime_on_off_day: 'bg-purple-200/30 dark:bg-purple-800/30',
  leave: 'bg-amber-200/30 dark:bg-amber-800/30',
  public_holiday: 'bg-red-200/30 dark:bg-red-800/30',
  training: 'bg-indigo-200/30 dark:bg-indigo-800/30',
  support_incoming: 'bg-cyan-200/30 dark:bg-cyan-800/30',
  support_outgoing: 'bg-orange-200/30 dark:bg-orange-800/30',
  co: 'bg-pink-200/30 dark:bg-pink-800/30',
  unknown: 'bg-gray-200/30 dark:bg-gray-700/30',
}

interface DayCellCompactProps {
  date: string
  schedule?: DaySchedule
  timeRecord?: TimeRecord
  isCurrentMonth: boolean
  isToday?: boolean
  onSelect?: (date: string) => void
}

function DayCellCompact({
  date,
  schedule,
  timeRecord,
  isCurrentMonth,
  isToday = false,
  onSelect,
}: DayCellCompactProps) {
  const dayNumber = date.split('-')[2]
  const holidayName = getPublicHolidayName(date)

  // 确定背景颜色
  const backgroundClass = schedule && !timeRecord
    ? typeBackgroundColors[schedule.type]
    : ''

  // 容器样式
  const containerClasses = cn(
    'day-cell-compact relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 select-none rounded-xl',
    isCurrentMonth
      ? 'bg-white/40 dark:bg-neutral-800/40 hover:bg-white/60 dark:hover:bg-neutral-700/60'
      : 'bg-transparent border-transparent opacity-0 pointer-events-none',
    isToday && isCurrentMonth && 'ring-2 ring-primary-500/50 dark:ring-primary-400/50 z-10',
    isCurrentMonth && backgroundClass
  )

  // 日期号样式
  // 日期号样式
  const dateNumberClasses = cn(
    'text-sm font-medium transition-colors',
    isToday ? 'text-blue-600 font-bold' : isCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-200 dark:text-slate-700',
    holidayName && 'text-red-500'
  )

  return (
    <div
      className={containerClasses}
      onClick={(e) => {
        e.stopPropagation()
        if (isCurrentMonth) onSelect?.(date)
      }}
    >
      <span className={dateNumberClasses}>{dayNumber}</span>

      {/* 状态指示器：已打卡显示蓝色圆点 */}
      {timeRecord && isCurrentMonth && (
        <div className="day-cell-compact__indicator" />
      )}
    </div>
  )
}

export default DayCellCompact
