import { DayType } from './timecard'
import { WorkScheduleType } from './employee'

export interface DailyPayResult {
  hoursWorked: number
  pay: PayComponents
}

export interface PayComponents {
  basePay: number
  overtimePay: number
  totalPay: number
  explanation?: string
  momReference?: string
}

export type ComplianceWarningType = 'DAILY_LIMIT' | 'MONTHLY_OT_LIMIT' | 'REST_DAY_VIOLATION'
export type ComplianceWarningSeverity = 'low' | 'medium' | 'high'

export interface ComplianceWarning {
  type: ComplianceWarningType
  message: string
  severity: ComplianceWarningSeverity
  momReference?: string
}

export interface AttendanceBonusImpact {
  fullAmount: number
  actualAmount: number
  rate: number
  reason: string
}

export interface CalculationDetails {
  hourlyRate: number
  dailyRate: number
  monthlyWorkingDays: number
  workScheduleType: WorkScheduleType
  totalOvertimeHours: number
  totalRestDayHours: number
  totalPHHours: number
  mcDays?: number
  unpaidLeaveDays?: number
  attendanceBonusImpact?: AttendanceBonusImpact
  overtimeBreakdown?: {
    workDay: { hours: number; pay: number }
    restDay: { hours: number; pay: number }
    publicHoliday: { hours: number; pay: number }
  }
  complianceWarnings?: string[]
}

export interface DailyBreakdown {
  date: string
  dayType: DayType
  hoursWorked: number
  pay: PayComponents
}

export interface SalaryResult {
  baseSalary: number
  attendanceBonus: number
  overtimePay: number
  publicHolidayPay: number
  restDayPay: number
  deductions: number
  totalGross: number
  netPay: number
  breakdown: DailyBreakdown[]
  compliance: {
    isCompliant: boolean
    warnings: ComplianceWarning[]
  }
  calculationDetails: CalculationDetails
}
