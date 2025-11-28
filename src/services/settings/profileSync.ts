import { useTimecardStore } from '@/store/timecardStore'
import { calculateMonthlySummary } from '@/services/salary/calculator'
import { upsertMonthlySummary } from '@/services/supabase/monthlySalaries'
import { getMonthlyMcDays } from '@/services/supabase/mcRecords'
import type { Employee } from '@/types/employee'
import type { TimeRecord } from '@/types/timecard'

export interface SettingsPropagationResult {
  monthsProcessed: number
  summariesPersisted: number
  warnings: string[]
}

const UNPAID_LEAVE_TAG = '[UNPAID_LEAVE]'

const computePayDateISO = (month: string, payDay: number): string => {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNumber = Number(monthStr)
  const normalizedPayDay = Math.max(1, Math.min(31, payDay || 7))
  const payoutMonthIndex = monthNumber === 12 ? 0 : monthNumber
  const payoutYear = monthNumber === 12 ? year + 1 : year
  const daysInTargetMonth = new Date(Date.UTC(payoutYear, payoutMonthIndex + 1, 0)).getUTCDate()
  const day = Math.min(normalizedPayDay, daysInTargetMonth)
  return `${payoutYear}-${String(payoutMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const toRecordEntries = () => {
  const state = useTimecardStore.getState()
  const entries: Array<{ month: string; records: TimeRecord[] }> = []
  Object.entries(state.recordsByMonth).forEach(([month, recordMap]) => {
    const records = Object.values(recordMap ?? {})
    if (records.length) {
      entries.push({ month, records })
    }
  })
  return entries
}

export const propagateProfileChange = async (
  profile: Employee,
): Promise<SettingsPropagationResult> => {
  const state = useTimecardStore.getState()
  state.setDefaultNormalHours(profile.normalWorkHours)

  const entries = toRecordEntries()
  entries.forEach(({ month, records }) => {
    state.setRecordsForMonth(month, records)
  })

  let summariesPersisted = 0
  const warnings: string[] = []

  await Promise.all(
    entries.map(async ({ month, records }) => {
      try {
        const mcDays = await getMonthlyMcDays(profile.id, month).catch((error) => {
          warnings.push(
            `MC data unavailable for ${month}: ${error instanceof Error ? error.message : error}`,
          )
          return 0
        })
        const unpaidLeaveDays = records.filter(
          (record) => record.notes?.includes(UNPAID_LEAVE_TAG),
        ).length
        const [yearStr, monthStr] = month.split('-')
        const summary = calculateMonthlySummary({
          records,
          baseSalary: profile.baseSalary,
          attendanceBonus: profile.attendanceBonus,
          mcDays,
          unpaidLeaveDays,
          workScheduleType: profile.workScheduleType,
          normalWorkHours: profile.normalWorkHours,
          year: Number(yearStr),
          month: Number(monthStr),
        })
        await upsertMonthlySummary({
          employeeId: profile.id,
          month,
          summary,
          estimatedPayDate: computePayDateISO(month, profile.payDay ?? 7),
        })
        summariesPersisted += 1
      } catch (error) {
        warnings.push(
          `Salary cache refresh failed for ${month}: ${
            error instanceof Error ? error.message : error
          }`,
        )
      }
    }),
  )

  return {
    monthsProcessed: entries.length,
    summariesPersisted,
    warnings,
  }
}
