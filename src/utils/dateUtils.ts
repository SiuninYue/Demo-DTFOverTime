import { WorkScheduleType } from '@/types/employee'

export type DateInput = string | Date

export interface WorkingDayOptions {
  publicHolidays?: DateInput[]
  customWorkingDays?: number[]
  customWorkingDates?: DateInput[]
  nonWorkingDates?: DateInput[]
}

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)

const normalizeDateInput = (date: DateInput): Date => {
  if (date instanceof Date) {
    return date
  }
  return date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00Z`)
}

const getWeekOfMonth = (day: number): number => Math.floor((day - 1) / 7)

const buildDateSet = (dates: DateInput[] = []): Set<string> => {
  const set = new Set<string>()
  dates.forEach((value) => set.add(toIsoDate(normalizeDateInput(value))))
  return set
}

const validateMonth = (month: number) => {
  if (month < 1 || month > 12) {
    throw new RangeError(`month must be between 1 and 12. Received: ${month}`)
  }
}

interface WorkingContext {
  nonWorkingSet: Set<string>
  customWorkingDateSet: Set<string>
}

const createWorkingContext = (options: WorkingDayOptions): WorkingContext => ({
  nonWorkingSet: buildDateSet(options.nonWorkingDates),
  customWorkingDateSet: buildDateSet(options.customWorkingDates),
})

const getWorkingDayWeight = (
  normalized: Date,
  scheduleType: WorkScheduleType,
  options: WorkingDayOptions,
  context: WorkingContext
): number => {
  const dayOfWeek = normalized.getUTCDay()
  const dateKey = toIsoDate(normalized)

  if (context.nonWorkingSet.has(dateKey)) {
    return 0
  }

  if (context.customWorkingDateSet.has(dateKey)) {
    return 1
  }

  switch (scheduleType) {
    case WorkScheduleType.FIVE_DAY:
      return dayOfWeek >= 1 && dayOfWeek <= 5 ? 1 : 0
    case WorkScheduleType.FIVE_HALF_DAY:
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return 1
      }
      if (dayOfWeek === 6) {
        const weekIndex = getWeekOfMonth(normalized.getUTCDate())
        return weekIndex % 2 === 1 ? 1 : 0
      }
      return 0
    case WorkScheduleType.SIX_DAY:
      return dayOfWeek >= 1 && dayOfWeek <= 6 ? 1 : 0
    case WorkScheduleType.FOUR_DAY:
      return dayOfWeek >= 1 && dayOfWeek <= 4 ? 1 : 0
    case WorkScheduleType.CUSTOM: {
      const workingDays = options.customWorkingDays
      if (!workingDays || workingDays.length === 0) {
        throw new Error('使用自定义工作制（WorkScheduleType.CUSTOM）时必须提供 customWorkingDays。')
      }
      return workingDays.includes(dayOfWeek) ? 1 : 0
    }
    default:
      return dayOfWeek >= 1 && dayOfWeek <= 5 ? 1 : 0
  }
}

export const isWorkingDay = (
  date: DateInput,
  scheduleType: WorkScheduleType,
  options: WorkingDayOptions = {}
): boolean => {
  const normalized = normalizeDateInput(date)
  const context = createWorkingContext(options)
  return getWorkingDayWeight(normalized, scheduleType, options, context) > 0
}

export const calculateWorkingDays = (
  year: number,
  month: number,
  scheduleType: WorkScheduleType,
  options: WorkingDayOptions = {}
): number => {
  validateMonth(month)
  const context = createWorkingContext(options)
  const publicHolidaySet = buildDateSet(options.publicHolidays)

  let workingDays = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(Date.UTC(year, month - 1, day))
    const dateKey = toIsoDate(currentDate)

    if (publicHolidaySet.has(dateKey)) {
      continue
    }

    if (context.nonWorkingSet.has(dateKey)) {
      continue
    }

    if (context.customWorkingDateSet.has(dateKey)) {
      workingDays += 1
      continue
    }

    workingDays += getWorkingDayWeight(currentDate, scheduleType, options, context)
  }

  return Math.round(workingDays * 100) / 100
}

export const getDaysInMonth = (year: number, month: number): number => {
  validateMonth(month)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * 获取某日期所在周的周日（一周的起始日期）
 * @param date 日期对象
 * @returns 该周的周日
 */
export const getWeekStart = (date: Date): Date => {
  const dayOfWeek = date.getDay() // 0 (Sunday) to 6 (Saturday)
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)
  sunday.setHours(0, 0, 0, 0)
  return sunday
}

/**
 * 计算该周的 7 天日期数组（从周日到周六）
 * @param weekStart 周日的日期
 * @returns 包含 7 天日期的数组
 */
export const getWeekDates = (weekStart: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })
}

/**
 * 格式化 ISO 日期字符串（YYYY-MM-DD）
 * @param date 日期对象
 * @returns ISO 格式的日期字符串
 */
export const formatISODate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化周范围显示（如 "2025-01-06 至 2025-01-12"）
 * @param weekStart 周日的日期
 * @returns 格式化的周范围字符串
 */
export const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${formatISODate(weekStart)} 至 ${formatISODate(weekEnd)}`
}
