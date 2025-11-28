import { afterEach, describe, expect, it } from 'vitest'
import { upsertSchedule } from '@/services/supabase/database'
import { createTimeRecord, getMonthlyRecords } from '@/services/supabase/timeRecords'
import { useTimecardStore } from '@/store/timecardStore'
import { DayType } from '@/types/timecard'
import { ScheduleType, type ScheduleData } from '@/types/schedule'
import { calculateMonthlySummary } from '@/services/salary/calculator'
import { WorkScheduleType } from '@/types/employee'
import {
  upsertMonthlySummary,
  getMonthlySummary,
} from '@/services/supabase/monthlySalaries'
import { inspectSupabaseTables } from '../mocks/supabaseClient'

const employeeId = 'employee-salary'
const month = '2025-11'

const scheduleTemplate: ScheduleData = {
  '2025-11-01': {
    type: ScheduleType.WORK,
    plannedStartTime: '09:00',
    plannedEndTime: '19:00',
    isStatutoryRestDay: false,
    notes: 'Dinner shift',
    isConfirmed: true,
  },
  '2025-11-02': {
    type: ScheduleType.REST,
    plannedStartTime: null,
    plannedEndTime: null,
    isStatutoryRestDay: true,
    notes: 'Mandatory rest',
    isConfirmed: true,
  },
}

afterEach(() => {
  useTimecardStore.getState().clear()
})

describe('Integration: salary pipeline', () => {
  it('imports schedule, records timecards, and persists calculated salary summary', async () => {
    await upsertSchedule({
      employeeId,
      month,
      scheduleData: scheduleTemplate,
      imageUrl: 'https://mock-supabase.local/schedule.jpg',
      recognitionAccuracy: 0.9,
      recognitionMethod: 'MANUAL',
    })

    const normalDay = await createTimeRecord({
      employeeId,
      date: '2025-11-01',
      dayType: DayType.NORMAL_WORK_DAY,
      actualStartTime: '09:00',
      actualEndTime: '19:00',
      restHours: 1,
      isEmployerRequested: true,
      spansMidnight: false,
      notes: 'Busy Friday',
    })

    const restDay = await createTimeRecord({
      employeeId,
      date: '2025-11-02',
      dayType: DayType.REST_DAY,
      actualStartTime: '10:00',
      actualEndTime: '16:00',
      restHours: 0.5,
      isEmployerRequested: true,
      spansMidnight: false,
      notes: 'Requested OT',
    })

    useTimecardStore.getState().setRecordsForMonth(month, [normalDay, restDay])

    const tables = inspectSupabaseTables()
    expect(tables.time_records).toHaveLength(2)

    const cachedRecords = await getMonthlyRecords(employeeId, month)
    expect(cachedRecords).toHaveLength(2)

    const summary = calculateMonthlySummary({
      records: cachedRecords,
      baseSalary: 1770,
      attendanceBonus: 200,
      mcDays: 0,
      workScheduleType: WorkScheduleType.FIVE_DAY,
      normalWorkHours: 8,
      year: 2025,
      month: 11,
    })

    expect(summary.baseSalary).toBeCloseTo(1770, 2)
    expect(summary.overtimePay).toBeGreaterThan(10)
    expect(summary.restDayPay).toBeCloseTo(177, 2)
    expect(summary.totalGross).toBeCloseTo(2160.92, 2)
    expect(summary.compliance.isCompliant).toBe(true)

    const persisted = await upsertMonthlySummary({
      employeeId,
      month,
      summary,
      estimatedPayDate: '2025-12-07',
    })

    expect(persisted.totalGross).toBeCloseTo(summary.totalGross, 2)

    const cachedSummary = await getMonthlySummary(employeeId, month)
    expect(cachedSummary?.totalGross).toBeCloseTo(summary.totalGross, 2)
    expect(cachedSummary?.calculationDetails?.monthlyWorkingDays).toBeGreaterThan(0)

    const storeSummary = useTimecardStore.getState().summaries[month]
    expect(storeSummary.totalRecords).toBe(2)
    expect(storeSummary.overtimeHours).toBeGreaterThan(0)
  })
})
