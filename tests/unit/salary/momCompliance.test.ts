import { describe, expect, it } from 'vitest'
import { WorkScheduleType } from '@/types/employee'
import {
  calculateDailyRate,
  calculateHourlyRate,
  calculateOvertimePay,
} from '@/services/salary/momCompliance'

const BASE_SALARY = 1770
const YEAR = 2025
const MONTH = 11

describe('MOM 基礎計算', () => {
  it('計算時薪 (baseSalary / 190.67)', () => {
    const hourlyRate = calculateHourlyRate(BASE_SALARY)
    expect(hourlyRate).toBeCloseTo(9.28, 2)
  })

  it('計算日薪 (baseSalary / 當月實際工作日數)', () => {
    const dailyRate = calculateDailyRate({
      baseSalary: BASE_SALARY,
      year: YEAR,
      month: MONTH,
      scheduleType: WorkScheduleType.FIVE_DAY,
    })

    expect(dailyRate).toBeCloseTo(88.5, 2)
  })

  it('計算一般OT報酬 (超出正常工時的1.5倍)', () => {
    const hourlyRate = calculateHourlyRate(BASE_SALARY)
    const overtime = calculateOvertimePay({
      hoursWorked: 10,
      normalHours: 8,
      hourlyRate,
    })

    expect(overtime).toBeCloseTo(27.84, 2)
  })
})
