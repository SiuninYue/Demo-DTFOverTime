import { WorkScheduleType } from '@/types/employee'
import { PayComponents } from '@/types/salary'
import { calculateWorkingDays, type WorkingDayOptions } from '@/utils/dateUtils'

const MOM_MONTHLY_AVERAGE_HOURS = 190.67
const DEFAULT_OVERTIME_MULTIPLIER = 1.5
const DEFAULT_HALF_DAY_HOURS = 4

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const calculateHourlyRate = (baseSalary: number): number =>
  roundMoney(baseSalary / MOM_MONTHLY_AVERAGE_HOURS)

export interface DailyRateInput {
  baseSalary: number
  year: number
  month: number
  scheduleType: WorkScheduleType
  workingDayOptions?: WorkingDayOptions
}

export const calculateDailyRate = ({
  baseSalary,
  year,
  month,
  scheduleType,
  workingDayOptions,
}: DailyRateInput): number => {
  const workingDays = calculateWorkingDays(year, month, scheduleType, workingDayOptions)

  if (workingDays <= 0) {
    throw new Error('当月工作日数需大于 0 才能计算日薪')
  }

  return roundMoney(baseSalary / workingDays)
}

export interface OvertimePayInput {
  hoursWorked: number
  normalHours: number
  hourlyRate: number
  multiplier?: number
}

export const calculateOvertimePay = ({
  hoursWorked,
  normalHours,
  hourlyRate,
  multiplier = DEFAULT_OVERTIME_MULTIPLIER,
}: OvertimePayInput): number => {
  const overtimeHours = Math.max(0, hoursWorked - normalHours)
  if (overtimeHours === 0) {
    return 0
  }
  return roundMoney(overtimeHours * hourlyRate * multiplier)
}

const buildPayComponents = (basePay: number, overtimePay: number): PayComponents => {
  const roundedBase = roundMoney(basePay)
  const roundedOt = roundMoney(overtimePay)
  return {
    basePay: roundedBase,
    overtimePay: roundedOt,
    totalPay: roundMoney(roundedBase + roundedOt),
  }
}

export interface RestDayPayInput {
  dailyRate: number
  hourlyRate: number
  hoursWorked: number
  normalHours: number
  isStatutoryRestDay: boolean
  isEmployerRequested: boolean
  halfDayThreshold?: number
  overtimeMultiplier?: number
}

export const calculateRestDayPay = ({
  dailyRate,
  hourlyRate,
  hoursWorked,
  normalHours,
  isStatutoryRestDay,
  isEmployerRequested,
  halfDayThreshold = DEFAULT_HALF_DAY_HOURS,
  overtimeMultiplier = DEFAULT_OVERTIME_MULTIPLIER,
}: RestDayPayInput): PayComponents => {
  // MOM规定：休息日不是带薪日。如果没有上班，不应该有任何额外工资
  // https://www.mom.gov.sg/employment-practices/salary/calculate-pay-for-work-on-rest-day
  if (hoursWorked <= 0) {
    return buildPayComponents(0, 0)
  }

  if (!isStatutoryRestDay) {
    // 非法定休息日：只有超过正常工时的部分才按加班费计算
    const overtimeOnly = calculateOvertimePay({
      hoursWorked,
      normalHours,
      hourlyRate,
      multiplier: overtimeMultiplier,
    })
    return buildPayComponents(0, overtimeOnly)
  }

  let basePay = 0

  if (isEmployerRequested) {
    basePay = hoursWorked <= halfDayThreshold ? dailyRate : dailyRate * 2
  } else {
    if (hoursWorked <= halfDayThreshold) {
      basePay = dailyRate * 0.5
    } else if (hoursWorked <= normalHours) {
      basePay = dailyRate
    } else {
      basePay = dailyRate
    }
  }

  const overtimePay = calculateOvertimePay({
    hoursWorked,
    normalHours,
    hourlyRate,
    multiplier: overtimeMultiplier,
  })

  return buildPayComponents(basePay, overtimePay)
}

export interface PublicHolidayPayInput {
  dailyRate: number
  hourlyRate: number
  hoursWorked: number
  normalHours: number
  overtimeMultiplier?: number
}

export const calculatePHPay = ({
  dailyRate,
  hourlyRate,
  hoursWorked,
  normalHours,
  overtimeMultiplier = DEFAULT_OVERTIME_MULTIPLIER,
}: PublicHolidayPayInput): PayComponents => {
  const basePay = hoursWorked > 0 ? dailyRate : 0
  const overtimePay = calculateOvertimePay({
    hoursWorked,
    normalHours,
    hourlyRate,
    multiplier: overtimeMultiplier,
  })

  return buildPayComponents(basePay, overtimePay)
}
