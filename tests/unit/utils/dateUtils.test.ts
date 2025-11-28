import { describe, expect, it } from 'vitest'
import { calculateWorkingDays } from '@/utils/dateUtils'
import { WorkScheduleType } from '@/types/employee'

describe('calculateWorkingDays', () => {
  it('5天工作制 2025/11 → 20 天', () => {
    expect(calculateWorkingDays(2025, 11, WorkScheduleType.FIVE_DAY)).toBe(20)
  })

  it('5.5天工作制 2025/11 → 22 天', () => {
    expect(calculateWorkingDays(2025, 11, WorkScheduleType.FIVE_HALF_DAY)).toBe(22)
  })

  it('6天工作制 2025/11 → 25 天', () => {
    expect(calculateWorkingDays(2025, 11, WorkScheduleType.SIX_DAY)).toBe(25)
  })
})
