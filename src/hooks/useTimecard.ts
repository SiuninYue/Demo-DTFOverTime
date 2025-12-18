import { useCallback, useEffect, useMemo, useState } from 'react'
import { DayType, type TimeRecord, type TimeRecordInput } from '@/types/timecard'
import type { DaySchedule } from '@/types/schedule'
import { useTimecardStore } from '@/store/timecardStore'
import { useSchedule } from '@/hooks/useSchedule'
import { useUserStore } from '@/store/userStore'
import {
  createTimeRecord,
  deleteTimeRecord,
  getTimeRecordByDate,
  updateTimeRecord,
} from '@/services/supabase/timeRecords'
import { deleteMcRecordByDate, upsertMcRecordForDate } from '@/services/supabase/mcRecords'
import { calculateDailyPay } from '@/services/salary/calculator'
import type { DailyPayResult } from '@/types/salary'

interface UseTimecardOptions {
  employeeId: string
  date: string
}

interface UseTimecardResult {
  record: TimeRecordInput & { id?: string }
  isLoading: boolean
  isSaving: boolean
  error: string | null
  hasChanges: boolean
  scheduleEntry?: DaySchedule
  preview?: DailyPayResult
  updateField: <K extends keyof TimeRecordInput>(field: K, value: TimeRecordInput[K]) => void
  setDayType: (dayType: DayType) => void
  normalHours: number
  resetToSchedule: () => void
  refresh: () => Promise<void>
  save: () => Promise<TimeRecord | null>
  remove: () => Promise<void>
}

const buildDefaultRecord = (date: string, dayType: DayType): TimeRecordInput => ({
  date,
  dayType,
  isStatutoryRestDay: dayType === DayType.REST_DAY,
  actualStartTime: null,
  actualEndTime: null,
  restHours: 1,
  isEmployerRequested: true,
  spansMidnight: false,
  notes: '',
})

const UNPAID_MC_TAG = '[UNPAID_MC]'

const scheduleToDayType = (schedule?: DaySchedule): DayType => {
  if (!schedule) return DayType.NORMAL_WORK_DAY
  if (schedule.type === 'rest') {
    return schedule.isStatutoryRestDay ? DayType.REST_DAY : DayType.OFF_DAY
  }
  if (schedule.type === 'off') return DayType.OFF_DAY
  if (schedule.type === 'public_holiday') return DayType.PUBLIC_HOLIDAY
  if (schedule.type === 'leave') return DayType.ANNUAL_LEAVE
  if (schedule.type === 'unknown') return DayType.NORMAL_WORK_DAY
  return DayType.NORMAL_WORK_DAY
}

export const useTimecard = ({ employeeId, date }: UseTimecardOptions): UseTimecardResult => {
  const month = date.slice(0, 7)
  const store = useTimecardStore()
  const [record, setRecord] = useState<TimeRecordInput & { id?: string }>(
    buildDefaultRecord(date, DayType.NORMAL_WORK_DAY),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const { schedule } = useSchedule({ employeeId, month, autoFetch: true })
  const scheduleEntry = schedule?.scheduleData[date]

  const userState = useUserStore()
  const hourlyRate = userState.computed?.hourlyRate ?? 0
  const dailyRate = userState.computed?.dailyRate ?? 0
  const normalHours = userState.profile?.normalWorkHours ?? 8

  const loadRecord = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const cached = store.recordsByMonth[month]?.[date]
    if (cached) {
      setRecord(cached)
      setIsLoading(false)
      setHasChanges(false)
      return
    }

    try {
      const remote = await getTimeRecordByDate(employeeId, date)
      if (remote) {
        setRecord(remote)
        store.upsertRecord(remote)
        setHasChanges(false)
      } else {
        const baseRecord = buildDefaultRecord(
          date,
          scheduleToDayType(schedule?.scheduleData[date]),
        )
        if (scheduleEntry?.plannedStartTime) {
          baseRecord.actualStartTime = scheduleEntry.plannedStartTime
        }
        if (scheduleEntry?.plannedEndTime) {
          baseRecord.actualEndTime = scheduleEntry.plannedEndTime
        }
        if (scheduleEntry?.isStatutoryRestDay) {
          baseRecord.isStatutoryRestDay = true
        }
        setRecord(baseRecord)
        setHasChanges(true)
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : '加载该日期的打卡记录失败。',
      )
    } finally {
      setIsLoading(false)
    }
  }, [date, employeeId, month, schedule?.scheduleData, scheduleEntry, store])

  useEffect(() => {
    loadRecord().catch(() => {
      /* handled in loadRecord */
    })
  }, [loadRecord])

  useEffect(() => {
    if (!scheduleEntry) {
      return
    }
    setRecord((current) => {
      if (current.id || current.actualStartTime || current.actualEndTime) {
        return current
      }
      const updated = { ...current }
      updated.dayType = scheduleToDayType(scheduleEntry)
      updated.actualStartTime = scheduleEntry.plannedStartTime ?? updated.actualStartTime
      updated.actualEndTime = scheduleEntry.plannedEndTime ?? updated.actualEndTime
      return updated
    })
  }, [scheduleEntry])

  const preview = useMemo(() => {
    if (!hourlyRate || !dailyRate) {
      return undefined
    }
    try {
      const recordForCalc: TimeRecord = {
        employeeId,
        ...record,
      }
      return calculateDailyPay({
        record: recordForCalc,
        hourlyRate,
        dailyRate,
        normalHours,
        restDayHalfDayThreshold: 4,
      })
    } catch {
      return undefined
    }
  }, [dailyRate, hourlyRate, normalHours, record, employeeId])

  const updateField = useCallback(
    <K extends keyof TimeRecordInput>(field: K, value: TimeRecordInput[K]) => {
      setRecord((current) => {
        const next = { ...current, [field]: value }
        if (current.id) {
          next.isModified = true
        }
        return next
      })
      setHasChanges(true)
    },
    [],
  )

  const setDayType = useCallback((dayType: DayType) => {
    setRecord((current) => {
      const next: typeof current = {
        ...current,
        dayType,
        isStatutoryRestDay:
          dayType === DayType.REST_DAY ? current.isStatutoryRestDay ?? true : false,
      }
      if (current.id) {
        next.isModified = true
      }
      return next
    })
    setHasChanges(true)
  }, [])

  const resetToSchedule = useCallback(() => {
    setRecord((current) => {
      const next = buildDefaultRecord(date, scheduleToDayType(scheduleEntry))
      next.id = current.id
      next.isModified = current.id ? true : current.isModified
      next.actualStartTime = scheduleEntry?.plannedStartTime ?? null
      next.actualEndTime = scheduleEntry?.plannedEndTime ?? null
      next.restHours = 1
      if (scheduleEntry?.isStatutoryRestDay !== undefined) {
        next.isStatutoryRestDay = scheduleEntry.isStatutoryRestDay
      }
      return next
    })
    setHasChanges(true)
  }, [date, scheduleEntry])

  const refresh = useCallback(async () => {
    await loadRecord()
  }, [loadRecord])

  const save = useCallback(async () => {
    if (!hasChanges) {
      return record.id ? ({ employeeId, ...record } as TimeRecord) : null
    }
    setIsSaving(true)
    setError(null)
    try {
      let saved: TimeRecord
      if (record.id) {
        saved = await updateTimeRecord(record.id, record)
      } else {
        saved = await createTimeRecord({ ...record, employeeId })
      }

      if (record.dayType === DayType.MEDICAL_LEAVE) {
        const isPaidMc = !(record.notes?.includes(UNPAID_MC_TAG) ?? false)
        await upsertMcRecordForDate({ employeeId, date: record.date, isPaid: isPaidMc }).catch(() => {
          /* keep timecard save resilient even if MC sync fails */
        })
      } else {
        await deleteMcRecordByDate({ employeeId, date: record.date }).catch(() => {
          /* deletion best-effort */
        })
      }

      const merged = { ...saved, isStatutoryRestDay: record.isStatutoryRestDay }
      store.upsertRecord(merged)
      setRecord(merged)
      setHasChanges(false)
      return saved
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : '保存打卡记录失败。'
      setError(message)
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }, [employeeId, hasChanges, record, store])

  const remove = useCallback(async () => {
    if (!record.id) {
      setRecord(buildDefaultRecord(date, scheduleToDayType(scheduleEntry)))
      setHasChanges(false)
      return
    }
    setIsSaving(true)
    try {
      await deleteTimeRecord(record.id)
      store.removeRecord(date)
      await deleteMcRecordByDate({ employeeId, date }).catch(() => {
        /* best-effort clean up */
      })
      setRecord(buildDefaultRecord(date, scheduleToDayType(scheduleEntry)))
      setHasChanges(false)
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : '删除打卡记录失败。'
      setError(message)
      throw deleteError
    } finally {
      setIsSaving(false)
    }
  }, [date, employeeId, record.id, scheduleEntry, store])

  return {
    record,
    isLoading,
    isSaving,
    error,
    hasChanges,
    scheduleEntry,
    preview,
    updateField,
    setDayType,
    resetToSchedule,
    refresh,
    normalHours,
    save,
    remove,
  }
}

export default useTimecard
