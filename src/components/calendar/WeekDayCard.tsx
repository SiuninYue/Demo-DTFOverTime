import type { DaySchedule, ScheduleType } from '@/types/schedule'
import { DayType, type TimeRecord } from '@/types/timecard'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPublicHolidayName } from '@/utils/holidays'

// 排班类型颜色（用于徽章）
const typeColors: Record<ScheduleType, string> = {
  work: 'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-200',
  rest: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  off: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  overtime_on_off_day: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  public_holiday: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  training: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  support_incoming: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  support_outgoing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  co: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

// 排班类型标签
const typeLabels: Record<ScheduleType, string> = {
  work: '工作',
  rest: '休息',
  off: 'OFF',
  overtime_on_off_day: '加班',
  leave: '请假',
  public_holiday: '公假',
  training: '培训',
  support_incoming: '轮班（入）',
  support_outgoing: '轮班（出）',
  co: 'CO',
  unknown: '未知',
}

// 星期几标签
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 格式化时间（"09:00:00" -> "09:00"）
const formatTimeShort = (timeStr?: string | null) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

const dayTypeLabels: Record<DayType, string> = {
  [DayType.NORMAL_WORK_DAY]: '已出勤',
  [DayType.REST_DAY]: '休息日',
  [DayType.PUBLIC_HOLIDAY]: '公假',
  [DayType.ANNUAL_LEAVE]: '年假',
  [DayType.MEDICAL_LEAVE]: '病假',
  [DayType.OFF_DAY]: 'OFF',
}

interface WeekDayCardProps {
  date: string
  schedule?: DaySchedule
  timeRecord?: TimeRecord
  isToday?: boolean
  onSelect?: (date: string) => void
}

function WeekDayCard({
  date,
  schedule,
  timeRecord,
  isToday = false,
  onSelect,
}: WeekDayCardProps) {
  const [, , dayStr] = date.split('-')
  const dayNumber = parseInt(dayStr, 10)
  const dateObj = new Date(date)
  const weekday = weekdayLabels[dateObj.getDay()]
  const holidayName = getPublicHolidayName(date)

  // 显示的时间信息
  const showRecordedTimes =
    timeRecord &&
    !(
      (timeRecord.dayType === DayType.REST_DAY || timeRecord.dayType === DayType.OFF_DAY) &&
      !timeRecord.isEmployerRequested
    )

  const containerClasses = cn(
    "relative flex flex-col w-full min-h-[5.5rem] border-[0.5px] border-white/20 dark:border-white/5 transition-all duration-200 select-none group backdrop-blur-[2px] rounded-xl overflow-hidden",
    "bg-white/40 dark:bg-neutral-800/40 hover:bg-white/60 dark:hover:bg-neutral-700/60 shadow-sm",
    isToday && "ring-2 ring-primary-500/50 dark:ring-primary-400/50 z-10"
  )

  return (
    <div
      className={containerClasses}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(date)
      }}
    >
      {/* 假期横幅（如果有） */}
      {holidayName && (
        <div className="bg-red-500 dark:bg-red-700 text-white text-[10px] font-bold px-3 py-1 text-center">
          {holidayName}
        </div>
      )}

      <div className="grid grid-cols-[3.5rem_1fr] items-center p-3 gap-3">
        {/* 左侧：日期区 */}
        <div className="flex flex-col items-center justify-center gap-1 border-r border-neutral-200/50 dark:border-white/5 pr-3">
          <div className={cn(
            "text-2xl font-bold leading-none",
            isToday ? "text-blue-600 dark:text-blue-400" : "text-neutral-700 dark:text-neutral-300"
          )}>
            {dayNumber}
          </div>
          <div className="text-xs text-neutral-500 font-medium">{weekday}</div>
        </div>

        {/* 核心内容区：状态与排班 */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {timeRecord ? (
              // 已打卡状态
              <>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
                  <Check className="w-3 h-3" />
                  <span className="truncate">{dayTypeLabels[timeRecord.dayType] ?? '已记录'}</span>
                </div>
                {showRecordedTimes && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tabular-nums px-0.5">
                    {formatTimeShort(timeRecord.actualStartTime)}
                    {timeRecord.actualEndTime ? ` - ${formatTimeShort(timeRecord.actualEndTime)}` : ''}
                  </div>
                )}
              </>
            ) : schedule ? (
              // 已排班状态
              <>
                <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold w-fit", typeColors[schedule.type])}>
                  <span className="truncate">{typeLabels[schedule.type]}</span>
                </div>
                {(schedule.plannedStartTime || schedule.plannedEndTime) && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tabular-nums px-0.5">
                    {formatTimeShort(schedule.plannedStartTime)}
                    {schedule.plannedEndTime ? ` - ${formatTimeShort(schedule.plannedEndTime)}` : ''}
                  </div>
                )}
              </>
            ) : (
              // 未排班状态
              <div className="text-xs text-neutral-400 dark:text-neutral-600 font-medium">
                未排班
              </div>
            )}
          </div>

          {/* 右侧 Check Icon */}
          {timeRecord && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeekDayCard
