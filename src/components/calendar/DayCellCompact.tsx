import type { DaySchedule, ScheduleType } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'
import { cn } from '@/lib/utils'
import { getPublicHolidayName } from '@/utils/holidays'

// 排班类型对应的颜色（增强饱和度）
const typeBackgroundColors: Record<ScheduleType, string> = {
  work: 'bg-slate-50 dark:bg-slate-800/50',
  rest: 'bg-emerald-100 dark:bg-emerald-900/40',
  off: 'bg-zinc-100 dark:bg-zinc-800/50',
  overtime_on_off_day: 'bg-violet-100 dark:bg-violet-900/40',
  leave: 'bg-amber-100 dark:bg-amber-900/40',
  public_holiday: 'bg-rose-100 dark:bg-rose-900/40',
  training: 'bg-indigo-100 dark:bg-indigo-900/40',
  support_incoming: 'bg-cyan-100 dark:bg-cyan-900/40',
  support_outgoing: 'bg-orange-100 dark:bg-orange-900/40',
  co: 'bg-pink-100 dark:bg-pink-900/40',
  unknown: 'bg-gray-50 dark:bg-gray-800/50',
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
  const dayNumber = parseInt(date.split('-')[2], 10)
  const holidayName = getPublicHolidayName(date)
  const isSunday = new Date(date).getDay() === 0

  // 只有有排班且未打卡时显示排班颜色背景
  const showScheduleBg = schedule && !timeRecord && isCurrentMonth
  const backgroundClass = showScheduleBg ? typeBackgroundColors[schedule.type] : ''

  // 容器：无边框、无默认背景
  const containerClasses = cn(
    'day-cell-compact relative flex flex-col items-center justify-center',
    'w-full h-full rounded-xl transition-all duration-150 select-none',
    isCurrentMonth ? backgroundClass : 'opacity-0 pointer-events-none',
    isCurrentMonth && 'active:scale-95'
  )

  // 日期文字样式
  const dateClasses = cn(
    'text-[15px] font-medium tracking-tight',
    // 周日红色
    isSunday && !isToday && isCurrentMonth && 'text-rose-500',
    // 公假红色加粗
    holidayName && !isToday && isCurrentMonth && 'text-rose-600 font-semibold',
    // 普通日期
    !isSunday && !holidayName && !isToday && isCurrentMonth && 'text-slate-700 dark:text-slate-200'
  )

  return (
    <div
      className={containerClasses}
      onClick={(e) => {
        e.stopPropagation()
        if (isCurrentMonth) onSelect?.(date)
      }}
    >
      {/* 今日：蓝色圆形 + 白色数字 */}
      {isToday && isCurrentMonth ? (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/30">
          <span className="text-white font-bold text-[15px]">{dayNumber}</span>
        </div>
      ) : (
        <span className={dateClasses}>{isCurrentMonth ? dayNumber : ''}</span>
      )}

      {/* 已打卡：右上角绿色三角形 */}
      {timeRecord && isCurrentMonth && (
        <div
          className="absolute top-0 right-0 w-0 h-0
            border-t-[10px] border-t-emerald-500 dark:border-t-emerald-400
            border-l-[10px] border-l-transparent"
          style={{ borderTopRightRadius: '12px' }}
        />
      )}

      {/* 公假小红点（非今日时显示） */}
      {holidayName && !isToday && isCurrentMonth && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />
      )}
    </div>
  )
}

export default DayCellCompact
