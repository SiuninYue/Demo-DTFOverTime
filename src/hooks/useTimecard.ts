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
import type { DailyPayResult } from '@/services/salary/calculator'
import { normalizeTimeRecord, normalizeTimeToMinutes } from '@/utils/timeUtils'

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

const buildDefaultRecord = (date: string, dayType: DayType): TimeRecordInput => {
  const isRestOrOffDay = dayType === DayType.REST_DAY || dayType === DayType.OFF_DAY
  return {
    date,
    dayType,
    isStatutoryRestDay: dayType === DayType.REST_DAY,
    actualStartTime: null,
    actualEndTime: null,
    restHours: isRestOrOffDay ? 0 : 1,
    isEmployerRequested: !isRestOrOffDay,
    spansMidnight: false,
    notes: '',
  }
}

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
      const normalized = normalizeTimeRecord(cached)
      setRecord(normalized)
      if (normalized !== cached) {
        store.upsertRecord(normalized)
      }
      setIsLoading(false)
      setHasChanges(false)
      return
    }

    try {
      const remote = await getTimeRecordByDate(employeeId, date)
      if (remote) {
        const normalized = normalizeTimeRecord(remote)
        setRecord(normalized)
        store.upsertRecord(normalized)
        setHasChanges(false)
      } else {
        const baseRecord = buildDefaultRecord(
          date,
          scheduleToDayType(schedule?.scheduleData[date]),
        )
        const plannedStart = normalizeTimeToMinutes(scheduleEntry?.plannedStartTime ?? null)
        const plannedEnd = normalizeTimeToMinutes(scheduleEntry?.plannedEndTime ?? null)
        if (plannedStart) {
          baseRecord.actualStartTime = plannedStart
        }
        if (plannedEnd) {
          baseRecord.actualEndTime = plannedEnd
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
      const plannedStart = normalizeTimeToMinutes(scheduleEntry.plannedStartTime ?? null)
      const plannedEnd = normalizeTimeToMinutes(scheduleEntry.plannedEndTime ?? null)
      updated.actualStartTime = plannedStart ?? updated.actualStartTime
      updated.actualEndTime = plannedEnd ?? updated.actualEndTime
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
        if (Object.is(current[field], value)) {
          return current
        }
        const next = { ...current, [field]: value }
        if (current.id) {
          next.isModified = true
        }
        setHasChanges(true)
        return next
      })
    },
    [],
  )

  const setDayType = useCallback((dayType: DayType) => {
    setRecord((current) => {
      if (current.dayType === dayType) {
        return current
      }
      const next: typeof current = {
        ...current,
        dayType,
        isStatutoryRestDay: dayType === DayType.REST_DAY,
      }
      if (current.id) {
        next.isModified = true
      }
      setHasChanges(true)
      return next
    })
  }, [])

  const resetToSchedule = useCallback(() => {
    setRecord((current) => {
      const next: TimeRecordInput & { id?: string } = buildDefaultRecord(date, scheduleToDayType(scheduleEntry))
      next.id = current.id
      next.isModified = current.id ? true : current.isModified
      next.actualStartTime = normalizeTimeToMinutes(scheduleEntry?.plannedStartTime ?? null) ?? null
      next.actualEndTime = normalizeTimeToMinutes(scheduleEntry?.plannedEndTime ?? null) ?? null
      next.restHours =
        next.dayType === DayType.REST_DAY || next.dayType === DayType.OFF_DAY ? 0 : 1
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
