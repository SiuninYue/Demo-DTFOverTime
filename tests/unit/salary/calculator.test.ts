import { describe, expect, it } from 'vitest'
import { calculateDailyPay, calculateMonthlySummary } from '@/services/salary/calculator'
import { DayType, type TimeRecord } from '@/types/timecard'
import { WorkScheduleType } from '@/types/employee'

const baseParams = {
  baseSalary: 1770,
  attendanceBonus: 200,
  workScheduleType: WorkScheduleType.FIVE_DAY,
  normalWorkHours: 8,
  year: 2025,
  month: 11,
}

const createRecord = (overrides: Partial<TimeRecord>): TimeRecord => ({
  date: '2025-11-01',
  dayType: DayType.NORMAL_WORK_DAY,
  restHours: 1,
  hoursWorked: 0,
  ...overrides,
})

describe('salary calculator - monthly summary', () => {
  it('aggregates normal, rest day and PH work with attendance bonus impact', () => {
    const records: TimeRecord[] = [
      createRecord({
        date: '2025-11-01',
        dayType: DayType.NORMAL_WORK_DAY,
        hoursWorked: 10,
      }),
      createRecord({
        date: '2025-11-02',
        dayType: DayType.REST_DAY,
        hoursWorked: 6,
        isEmployerRequested: true,
      }),
      createRecord({
        date: '2025-11-03',
        dayType: DayType.PUBLIC_HOLIDAY,
        hoursWorked: 10,
      }),
    ]

    const result = calculateMonthlySummary({
      ...baseParams,
      mcDays: 3, // 3天MC时，根据companyRules，rate=0.5
      records,
    })

    expect(result.baseSalary).toBeCloseTo(1770, 2)
    expect(result.attendanceBonus).toBeCloseTo(100, 2)
    expect(result.restDayPay).toBeCloseTo(177, 2)
    expect(result.publicHolidayPay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBeCloseTo(55.68, 2)
    expect(result.totalGross).toBeCloseTo(2191.18, 2)
    expect(result.netPay).toBeCloseTo(2191.18, 2)
    expect(result.breakdown).toHaveLength(3)
    expect(result.calculationDetails.hourlyRate).toBeCloseTo(9.28, 2)
    expect(result.calculationDetails.attendanceBonusImpact?.actualAmount).toBeCloseTo(100, 2)
    expect(result.calculationDetails.attendanceBonusImpact?.rate).toBeCloseTo(0.5)
    expect(result.compliance.isCompliant).toBe(true)
  })

  it('flags compliance warnings for daily and monthly overtime limits', () => {
    const heavyRecords: TimeRecord[] = [
      createRecord({
        date: '2025-11-01',
        dayType: DayType.NORMAL_WORK_DAY,
        hoursWorked: 13,
      }),
      ...Array.from({ length: 10 }).map((_, index) =>
        createRecord({
          date: `2025-11-${String(index + 2).padStart(2, '0')}`,
          dayType: DayType.REST_DAY,
          hoursWorked: 16,
          isEmployerRequested: true,
        })
      ),
    ]

    const result = calculateMonthlySummary({
      ...baseParams,
      mcDays: 0,
      records: heavyRecords,
    })

    expect(result.compliance.isCompliant).toBe(false)
    const warningTypes = result.compliance.warnings.map((warning) => warning.type)
    expect(warningTypes).toContain('DAILY_LIMIT')
    expect(warningTypes).toContain('MONTHLY_OT_LIMIT')
    expect(result.calculationDetails.totalOvertimeHours).toBeGreaterThan(72)
  })
})

describe('salary calculator - calculateDailyPay helper', () => {
  it('derives pay using start/end time when hoursWorked is empty', () => {
    const record = createRecord({
      date: '2025-11-05',
      dayType: DayType.PUBLIC_HOLIDAY,
      hoursWorked: null,
      actualStartTime: '09:00',
      actualEndTime: '19:00',
      restHours: 1,
    })

    const { pay, hoursWorked } = calculateDailyPay({
      record,
      hourlyRate: 9.28,
      dailyRate: 88.5,
      normalHours: 8,
    })

    expect(hoursWorked).toBeCloseTo(9, 2)
    expect(pay.basePay).toBeCloseTo(88.5, 2)
    expect(pay.overtimePay).toBeCloseTo(13.92, 2)
    expect(pay.totalPay).toBeCloseTo(102.42, 2)
  })
})
