import { afterEach, describe, expect, it } from 'vitest'
import { useTimecardStore } from '@/store/timecardStore'
import { DayType, type TimeRecord } from '@/types/timecard'
import { createTimeRecord } from '@/services/supabase/timeRecords'
import { createMcRecord, getMonthlyMcDays } from '@/services/supabase/mcRecords'
import { calculateMonthlySummary } from '@/services/salary/calculator'
import { WorkScheduleType } from '@/types/employee'
import {
  upsertMonthlySummary,
  getMonthlySummary,
} from '@/services/supabase/monthlySalaries'

const employeeId = 'employee-mc'
const month = '2025-11'

const baseRecord: TimeRecord = {
  employeeId,
  date: '2025-11-03',
  dayType: DayType.NORMAL_WORK_DAY,
  actualStartTime: '10:00',
  actualEndTime: '19:00',
  restHours: 1,
  isEmployerRequested: true,
  spansMidnight: false,
  notes: 'Standard shift',
}

afterEach(() => {
  useTimecardStore.getState().clear()
})

describe('Integration: MC records impact salary projections', () => {
  it('reduces attendance bonus and updates cached salary summary after MC submission', async () => {
    const workingRecord = await createTimeRecord({
      employeeId,
      date: baseRecord.date,
      dayType: baseRecord.dayType,
      actualStartTime: baseRecord.actualStartTime,
      actualEndTime: baseRecord.actualEndTime,
      restHours: baseRecord.restHours,
      isEmployerRequested: baseRecord.isEmployerRequested,
      spansMidnight: baseRecord.spansMidnight,
      notes: baseRecord.notes ?? undefined,
    })

    useTimecardStore.getState().setRecordsForMonth(month, [workingRecord])

    const baselineSummary = calculateMonthlySummary({
      records: [workingRecord],
      baseSalary: 1770,
      attendanceBonus: 200,
      mcDays: 0,
      workScheduleType: WorkScheduleType.FIVE_DAY,
      normalWorkHours: 8,
      year: 2025,
      month: 11,
    })

    expect(baselineSummary.attendanceBonus).toBeCloseTo(200, 2)

    await createMcRecord({
      employeeId,
      date: '2025-11-10',
      days: 2,
      certificateNumber: 'SG-MC-001',
      reason: 'Flu',
    })

    const mcDays = await getMonthlyMcDays(employeeId, month)
    expect(mcDays).toBe(2)

    const updatedSummary = calculateMonthlySummary({
      records: [workingRecord],
      baseSalary: 1770,
      attendanceBonus: 200,
      mcDays,
      workScheduleType: WorkScheduleType.FIVE_DAY,
      normalWorkHours: 8,
      year: 2025,
      month: 11,
    })

    expect(updatedSummary.attendanceBonus).toBeLessThan(baselineSummary.attendanceBonus)
    expect(updatedSummary.attendanceBonus).toBeCloseTo(100, 2)
    expect(updatedSummary.calculationDetails.attendanceBonusImpact?.reason).toContain('MC 2天')

    await upsertMonthlySummary({
      employeeId,
      month,
      summary: updatedSummary,
      estimatedPayDate: '2025-12-07',
    })

    const cached = await getMonthlySummary(employeeId, month)
    expect(cached?.attendanceBonus).toBeCloseTo(100, 2)
    expect(cached?.calculationDetails?.attendanceBonusImpact?.reason).toContain('MC 2天')
  })
})
