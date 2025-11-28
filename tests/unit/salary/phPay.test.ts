import { describe, expect, it } from 'vitest'
import {
  calculatePHPay,
  calculateHourlyRate,
} from '@/services/salary/momCompliance'

const BASE_SALARY = 1770
const hourlyRate = calculateHourlyRate(BASE_SALARY)
const dailyRate = 88.5
const normalHours = 8

describe('公共假期 (PH) 報酬計算', () => {
  it('PH 工作 6h → 額外 1 日薪', () => {
    const result = calculatePHPay({ dailyRate, hourlyRate, hoursWorked: 6, normalHours })
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(88.5, 2)
  })

  it('PH 工作 8h → 額外 1 日薪', () => {
    const result = calculatePHPay({ dailyRate, hourlyRate, hoursWorked: 8, normalHours })
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(88.5, 2)
  })

  it('PH 工作 10h → 額外 1 日薪 + OT', () => {
    const result = calculatePHPay({ dailyRate, hourlyRate, hoursWorked: 10, normalHours })
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBeCloseTo(27.84, 2)
    expect(result.totalPay).toBeCloseTo(116.34, 2)
  })
})
