import { describe, expect, it } from 'vitest'
import {
  calculateHourlyRate,
  calculateRestDayPay,
} from '@/services/salary/momCompliance'

const BASE_SALARY = 1770
const hourlyRate = calculateHourlyRate(BASE_SALARY)
const dailyRate = 88.5
const normalHours = 8

const createParams = (overrides: Partial<Parameters<typeof calculateRestDayPay>[0]>) => ({
  dailyRate,
  hourlyRate,
  hoursWorked: 0,
  normalHours,
  isStatutoryRestDay: true,
  isEmployerRequested: true,
  ...overrides,
})

describe('Rest Day 薪資計算 (MOM)', () => {
  it('法定休息日 + 雇主要求 ≤ 半日 → 1 日薪', () => {
    const result = calculateRestDayPay(createParams({ hoursWorked: 3 }))
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(88.5, 2)
  })

  it('法定休息日 + 雇主要求 > 半日 → 2 日薪', () => {
    const result = calculateRestDayPay(createParams({ hoursWorked: 6 }))
    expect(result.basePay).toBeCloseTo(177, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(177, 2)
  })

  it('法定休息日 + 雇主要求 + 超時 → 2 日薪 + OT', () => {
    const result = calculateRestDayPay(createParams({ hoursWorked: 10 }))
    expect(result.basePay).toBeCloseTo(177, 2)
    expect(result.overtimePay).toBeCloseTo(27.84, 2)
    expect(result.totalPay).toBeCloseTo(204.84, 2)
  })

  it('法定休息日 + 員工要求 ≤ 半日 → 0.5 日薪', () => {
    const result = calculateRestDayPay(
      createParams({ hoursWorked: 3, isEmployerRequested: false })
    )
    expect(result.basePay).toBeCloseTo(44.25, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(44.25, 2)
  })

  it('法定休息日 + 員工要求 ≤ 正常工時 → 1 日薪', () => {
    const result = calculateRestDayPay(
      createParams({ hoursWorked: 6, isEmployerRequested: false })
    )
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBe(0)
    expect(result.totalPay).toBeCloseTo(88.5, 2)
  })

  it('法定休息日 + 員工要求 + 超時 → 1 日薪 + OT', () => {
    const result = calculateRestDayPay(
      createParams({ hoursWorked: 10, isEmployerRequested: false })
    )
    expect(result.basePay).toBeCloseTo(88.5, 2)
    expect(result.overtimePay).toBeCloseTo(27.84, 2)
    expect(result.totalPay).toBeCloseTo(116.34, 2)
  })

  it('非法定休息日 → 僅計 OT (超出正常工時)', () => {
    const result = calculateRestDayPay(
      createParams({ hoursWorked: 10, isStatutoryRestDay: false })
    )
    expect(result.basePay).toBe(0)
    expect(result.overtimePay).toBeCloseTo(27.84, 2)
    expect(result.totalPay).toBeCloseTo(27.84, 2)
  })
})
