import { MOM_MONTHLY_OVERTIME_LIMIT } from '@/config/constants'
import { WorkScheduleType } from '@/types/employee'
import { DayType, type TimeRecord } from '@/types/timecard'
import type {
  DailyBreakdown,
  PayComponents,
  SalaryResult,
  ComplianceWarning,
} from '@/types/salary'
import { calculateWorkingDays, type WorkingDayOptions } from '@/utils/dateUtils'
import {
  calculateDailyRate,
  calculateHourlyRate,
  calculateOvertimePay,
  calculatePHPay,
  calculateRestDayPay,
} from './momCompliance'
import { calculateAttendanceBonus } from './companyRules'

const roundMoney = (value: number): number => Math.round(value * 100) / 100
const UNPAID_MC_TAG = '[UNPAID_MC]'
const UNPAID_LEAVE_TAG = '[UNPAID_LEAVE]'

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

const calculateDurationHours = (
  startTime?: string | null,
  endTime?: string | null,
  spansMidnight?: boolean
): number => {
  if (!startTime || !endTime) {
    return 0
  }

  let duration = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)

  if (duration < 0 || spansMidnight) {
    duration += 24 * 60
  }

  return duration / 60
}

const getHoursWorked = (record: TimeRecord): number => {
  if (typeof record.hoursWorked === 'number' && !Number.isNaN(record.hoursWorked)) {
    return Math.max(0, record.hoursWorked)
  }

  const durationHours = calculateDurationHours(
    record.actualStartTime,
    record.actualEndTime,
    record.spansMidnight
  )

  const restHours = typeof record.restHours === 'number' ? record.restHours : 0
  const hoursWorked = durationHours - restHours

  return Math.max(0, Math.round(hoursWorked * 100) / 100)
}

const getOvertimeHours = (dayType: DayType, hoursWorked: number, normalHours: number): number => {
  switch (dayType) {
    case DayType.REST_DAY:
    case DayType.PUBLIC_HOLIDAY:
    case DayType.NORMAL_WORK_DAY:
      return Math.max(0, hoursWorked - normalHours)
    default:
      return 0
  }
}

export interface DailyPayParams {
  record: TimeRecord
  hourlyRate: number
  dailyRate: number
  normalHours: number
  restDayHalfDayThreshold?: number
  overtimeMultiplier?: number
}

export interface DailyPayResult {
  hoursWorked: number
  pay: PayComponents
}

export const calculateDailyPay = ({
  record,
  hourlyRate,
  dailyRate,
  normalHours,
  restDayHalfDayThreshold = 4,
  overtimeMultiplier = 1.5,
}: DailyPayParams): DailyPayResult => {
  const hoursWorked = getHoursWorked(record)
  let pay: PayComponents

  switch (record.dayType) {
    case DayType.REST_DAY:
      pay = calculateRestDayPay({
        dailyRate,
        hourlyRate,
        hoursWorked,
        normalHours,
        isStatutoryRestDay: record.isStatutoryRestDay ?? true,
        isEmployerRequested: record.isEmployerRequested ?? true,
        halfDayThreshold: restDayHalfDayThreshold,
        overtimeMultiplier,
      })
      break
    case DayType.OFF_DAY:
      pay = calculateRestDayPay({
        dailyRate,
        hourlyRate,
        hoursWorked,
        normalHours,
        isStatutoryRestDay: false,
        isEmployerRequested: record.isEmployerRequested ?? false,
        halfDayThreshold: restDayHalfDayThreshold,
        overtimeMultiplier,
      })
      break
    case DayType.PUBLIC_HOLIDAY:
      pay = calculatePHPay({
        dailyRate,
        hourlyRate,
        hoursWorked,
        normalHours,
        overtimeMultiplier,
      })
      break
    case DayType.NORMAL_WORK_DAY:
      pay = (() => {
        const overtimePay = calculateOvertimePay({
          hoursWorked,
          normalHours,
          hourlyRate,
          multiplier: overtimeMultiplier,
        })
        const roundedOt = roundMoney(overtimePay)
        return {
          basePay: 0,
          overtimePay: roundedOt,
          totalPay: roundedOt,
        }
      })()
      break
    default:
      pay = { basePay: 0, overtimePay: 0, totalPay: 0 }
  }

  return { hoursWorked, pay }
}

export interface MonthlySummaryParams {
  records: TimeRecord[]
  baseSalary: number
  attendanceBonus: number
  mcDays?: number
  unpaidLeaveDays?: number
  workScheduleType: WorkScheduleType
  normalWorkHours?: number
  year: number
  month: number
  workingDayOptions?: WorkingDayOptions
  restDayHalfDayThreshold?: number
  overtimeMultiplier?: number
  deductions?: number
}

export const calculateMonthlySummary = ({
  records,
  baseSalary,
  attendanceBonus,
  mcDays = 0,
  unpaidLeaveDays = 0,
  workScheduleType,
  normalWorkHours = 8,
  year,
  month,
  workingDayOptions,
  restDayHalfDayThreshold,
  overtimeMultiplier,
  deductions = 0,
}: MonthlySummaryParams): SalaryResult => {
  const hourlyRate = calculateHourlyRate(baseSalary)
  const monthlyWorkingDays = calculateWorkingDays(year, month, workScheduleType, workingDayOptions)
  const dailyRate = calculateDailyRate({
    baseSalary,
    year,
    month,
    scheduleType: workScheduleType,
    workingDayOptions,
  })

  const attendance = calculateAttendanceBonus({
    baseAmount: attendanceBonus,
    mcDays,
    unpaidLeaveDays,
  })

  let overtimePay = 0
  let restDayPay = 0
  let publicHolidayPay = 0
  let totalOvertimeHours = 0
  let totalRestDayHours = 0
  let totalPHHours = 0
  let workdayOtHours = 0
  let restDayOtHours = 0
  let phOtHours = 0
  let workdayOtPay = 0
  let restDayOtPay = 0
  let phOtPay = 0
  let unpaidLeaveDeduction = 0

  const breakdown: DailyBreakdown[] = []
  const complianceWarnings: ComplianceWarning[] = []

  records.forEach((record) => {
    const hasUnpaidMcTag = record.notes?.includes(UNPAID_MC_TAG) ?? false
    const hasUnpaidLeaveTag = record.notes?.includes(UNPAID_LEAVE_TAG) ?? false

    const { pay, hoursWorked } = calculateDailyPay({
      record,
      hourlyRate,
      dailyRate,
      normalHours: normalWorkHours,
      restDayHalfDayThreshold,
      overtimeMultiplier,
    })

    if (hoursWorked > 12) {
      complianceWarnings.push({
        type: 'DAILY_LIMIT',
        message: `${record.date} 工時 ${hoursWorked}h 超過12小時上限`,
        severity: 'high',
        momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days',
      })
    }

    const overtimeHours = getOvertimeHours(record.dayType, hoursWorked, normalWorkHours)
    totalOvertimeHours += overtimeHours

    switch (record.dayType) {
      case DayType.REST_DAY: {
        restDayPay += pay.basePay
        totalRestDayHours += hoursWorked
        restDayOtHours += overtimeHours
        restDayOtPay += pay.overtimePay
        overtimePay += pay.overtimePay
        break
      }
      case DayType.PUBLIC_HOLIDAY: {
        publicHolidayPay += pay.basePay
        totalPHHours += hoursWorked
        phOtHours += overtimeHours
        phOtPay += pay.overtimePay
        overtimePay += pay.overtimePay
        break
      }
      case DayType.NORMAL_WORK_DAY: {
        workdayOtHours += overtimeHours
        workdayOtPay += pay.overtimePay
        overtimePay += pay.overtimePay
        break
      }
      case DayType.MEDICAL_LEAVE: {
        if (hasUnpaidMcTag) {
          unpaidLeaveDeduction += dailyRate
        }
        break
      }
      case DayType.ANNUAL_LEAVE: {
        if (hasUnpaidLeaveTag) {
          unpaidLeaveDeduction += dailyRate
        }
        break
      }
      default:
        break
    }

    breakdown.push({
      date: record.date,
      dayType: record.dayType,
      hoursWorked,
      pay,
    })
  })

  if (totalOvertimeHours > MOM_MONTHLY_OVERTIME_LIMIT) {
    complianceWarnings.push({
      type: 'MONTHLY_OT_LIMIT',
      message: `本月加班 ${totalOvertimeHours.toFixed(
        1
      )}h 超過 MOM 規定的 72h 上限`,
      severity: 'medium',
      momReference: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days',
    })
  }

  const gross =
    roundMoney(baseSalary) +
    attendance.amount +
    roundMoney(restDayPay) +
    roundMoney(publicHolidayPay) +
    roundMoney(overtimePay)

  const cappedUnpaidLeaveDeduction = Math.min(unpaidLeaveDeduction, Math.max(0, roundMoney(baseSalary)))
  const roundedDeductions = roundMoney(deductions + cappedUnpaidLeaveDeduction)
  const net = Math.max(0, roundMoney(gross - roundedDeductions))

  return {
    baseSalary: roundMoney(baseSalary),
    attendanceBonus: attendance.amount,
    overtimePay: roundMoney(overtimePay),
    publicHolidayPay: roundMoney(publicHolidayPay),
    restDayPay: roundMoney(restDayPay),
    deductions: roundedDeductions,
    totalGross: roundMoney(gross),
    netPay: net,
    breakdown,
    compliance: {
      isCompliant: complianceWarnings.length === 0,
      warnings: complianceWarnings,
    },
    calculationDetails: {
      hourlyRate: roundMoney(hourlyRate),
      dailyRate,
      monthlyWorkingDays,
      workScheduleType,
      totalOvertimeHours: roundMoney(totalOvertimeHours),
      totalRestDayHours: roundMoney(totalRestDayHours),
      totalPHHours: roundMoney(totalPHHours),
      mcDays,
      unpaidLeaveDays,
      attendanceBonusImpact: attendance.impact,
      overtimeBreakdown: {
        workDay: { hours: roundMoney(workdayOtHours), pay: roundMoney(workdayOtPay) },
        restDay: { hours: roundMoney(restDayOtHours), pay: roundMoney(restDayOtPay) },
        publicHoliday: { hours: roundMoney(phOtHours), pay: roundMoney(phOtPay) },
      },
      complianceWarnings: complianceWarnings.map((warning) => warning.message),
    },
  }
}
