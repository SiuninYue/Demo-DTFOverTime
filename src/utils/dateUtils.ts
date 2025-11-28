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
        throw new Error('customWorkingDays must be provided when using WorkScheduleType.CUSTOM')
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
