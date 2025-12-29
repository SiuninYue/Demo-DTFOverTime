import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type MCRecord,
  type CreateMcRecordInput,
  createMcRecord,
  deleteMcRecord,
  deleteMcRecordByDate,
  getMonthlyMcRecords,
  getYearlyMcCount,
  updateMcRecordByDate,
} from '@/services/supabase/mcRecords'
import { upsertMcDates, getMonthlyRecords } from '@/services/supabase/timeRecords'
import { useTimecardStore } from '@/store/timecardStore'
import { useScheduleStore } from '@/store/scheduleStore'
import { DayType, type TimeRecord } from '@/types/timecard'

export type NewMcRecordInput = Omit<CreateMcRecordInput, 'employeeId'>

export interface UseMCOptions {
  employeeId: string
  month: string
  autoLoad?: boolean
  onRecalculate?: () => Promise<void> | void
}

export interface UseMCStats {
  monthlyDays: number
  yearlyDays: number
  quota: number
  quotaProgress: number
  quotaRemaining: number
  isQuotaExceeded: boolean
}

export interface UseMCResult {
  records: MCRecord[]
  stats: UseMCStats
  isLoading: boolean
  isYearlyLoading: boolean
  isMutating: boolean
  error: string | null
  refresh: () => Promise<void>
  addRecord: (input: NewMcRecordInput) => Promise<void>
  removeRecord: (id: string) => Promise<void>
}

const DEFAULT_YEARLY_MC_QUOTA = 14
const UNPAID_MC_TAG = '[UNPAID_MC]'

const selectPreferredMcRecord = (records: MCRecord[]): MCRecord => {
  const withMeta = records.find((record) => record.certificateNumber || record.reason)
  return withMeta ?? records[0]
}

const extractYear = (month: string): number => {
  const match = month.match(/^(\d{4})-/)
  if (!match) {
    return new Date().getUTCFullYear()
  }
  return Number(match[1])
}

const expandMcDates = (records: MCRecord[]): string[] => {
  const dates: string[] = []
  records.forEach((record) => {
    const span = Math.max(1, record.days)
    const base = new Date(`${record.date}T00:00:00`)
    for (let i = 0; i < span; i += 1) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
  })
  return dates
}

const buildRecordMap = (records: TimeRecord[]): Record<string, TimeRecord> =>
  records.reduce<Record<string, TimeRecord>>((acc, record) => {
    if (record.date) {
      acc[record.date] = record
    }
    return acc
  }, {})

export const useMC = ({
  employeeId,
  month,
  autoLoad = true,
  onRecalculate,
}: UseMCOptions): UseMCResult => {
  const [records, setRecords] = useState<MCRecord[]>([])
  const [monthlyDays, setMonthlyDays] = useState(0)
  const [yearlyDays, setYearlyDays] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isMonthLoading, setMonthLoading] = useState(autoLoad)
  const [isYearLoading, setYearLoading] = useState(autoLoad)
  const [isMutating, setIsMutating] = useState(false)
  const duplicateIdsRef = useRef<string[]>([])
  const refreshRef = useRef<() => Promise<void>>(undefined)
  const year = useMemo(() => extractYear(month), [month])
  const loadMonthRecords = useTimecardStore((state) => state.loadMonth)
  const schedule = useScheduleStore((state) => state.schedules[month])
  const timeRecords = useTimecardStore((state) => state.recordsByMonth[month] ?? {})

  const ensureRecordsForMonth = useCallback(async () => {
    if (Object.keys(timeRecords).length) {
      return timeRecords
    }
    try {
      const fetched = await loadMonthRecords(month, () => getMonthlyRecords(employeeId, month))
      return buildRecordMap(fetched)
    } catch {
      return timeRecords
    }
  }, [employeeId, loadMonthRecords, month, timeRecords])

  const applyMcToTimecards = useCallback(
    async (mcList: MCRecord[]) => {
      const monthPrefix = `${month}-`
      const recordsByDate = await ensureRecordsForMonth()
      const mcDates = expandMcDates(mcList).filter((date) => date.startsWith(monthPrefix))
      const entries = mcDates.map((date) => {
        const matched = mcList.find((record) => {
          const start = new Date(`${record.date}T00:00:00`)
          const end = new Date(start)
          end.setDate(start.getDate() + Math.max(1, record.days) - 1)
          const iso = new Date(`${date}T00:00:00`)
          return iso >= start && iso <= end
        })
        return { date, isPaid: matched?.isPaid !== false }
      })
      const filteredEntries = entries.filter(({ date }) => {
        const existingRecord = recordsByDate[date]
        if (existingRecord && existingRecord.dayType !== 'MEDICAL_LEAVE') {
          return false
        }
        const entry = schedule?.scheduleData?.[date]
        if (!entry) return true
        return !['rest', 'off', 'public_holiday'].includes(entry.type)
      })
      if (!filteredEntries.length) return
      await upsertMcDates({ employeeId, entries: filteredEntries })
      await loadMonthRecords(month, () => getMonthlyRecords(employeeId, month))
    },
    [employeeId, ensureRecordsForMonth, loadMonthRecords, month, schedule],
  )

  const normalizeMonthlyRecords = useCallback((records: MCRecord[]) => {
    const grouped = new Map<string, MCRecord[]>()
    records.forEach((record) => {
      if (!record.date) return
      const list = grouped.get(record.date) ?? []
      list.push(record)
      grouped.set(record.date, list)
    })

    const normalized: MCRecord[] = []
    const duplicates: string[] = []

    grouped.forEach((list) => {
      if (list.length === 1) {
        normalized.push(list[0])
        return
      }
      const keep = selectPreferredMcRecord(list)
      normalized.push(keep)
      list.forEach((record) => {
        if (record.id !== keep.id) {
          duplicates.push(record.id)
        }
      })
    })

    duplicateIdsRef.current = duplicates
    return normalized
  }, [])

  const cleanupDuplicateRecords = useCallback(async () => {
    const ids = duplicateIdsRef.current
    if (!ids.length) {
      return false
    }
    await Promise.all(ids.map((id) => deleteMcRecord(id)))
    duplicateIdsRef.current = []
    return true
  }, [])

  const syncTimecardsToMc = useCallback(
    async (mcList: MCRecord[]) => {
      const recordsByDate = await ensureRecordsForMonth()
      const monthPrefix = `${month}-`
      const mcMap = new Map(mcList.map((record) => [record.date, record]))
      const tasks: Array<Promise<unknown>> = []

      Object.values(recordsByDate).forEach((record) => {
        if (!record.date || !record.date.startsWith(monthPrefix)) {
          return
        }
        if (record.dayType !== DayType.MEDICAL_LEAVE) {
          return
        }
        const isPaid = !(record.notes?.includes(UNPAID_MC_TAG) ?? false)
        const existing = mcMap.get(record.date)
        if (!existing) {
          tasks.push(
            createMcRecord({
              employeeId,
              date: record.date,
              days: 1,
              isPaid,
            }),
          )
          return
        }
        if (existing.isPaid !== isPaid) {
          tasks.push(updateMcRecordByDate({ employeeId, date: record.date, updates: { is_paid: isPaid } }))
        }
      })

      if (!tasks.length) {
        return false
      }

      await Promise.all(tasks)
      return true
    },
    [employeeId, ensureRecordsForMonth, month],
  )

  const handleRecalculate = useCallback(async () => {
    if (!onRecalculate) {
      return
    }
    await Promise.resolve(onRecalculate())
  }, [onRecalculate])

  const loadMonthly = useCallback(async (): Promise<MCRecord[]> => {
    setMonthLoading(true)
    try {
      const data = await getMonthlyMcRecords(employeeId, month)
      const normalized = normalizeMonthlyRecords(data)
      setRecords(normalized)
      const total = normalized.reduce((acc, record) => acc + Math.max(0, record.days), 0)
      setMonthlyDays(total)
      setError(null)
      return normalized
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : '加载病假记录失败。'
      setError(message)
      throw loadError
    } finally {
      setMonthLoading(false)
    }
  }, [employeeId, month, normalizeMonthlyRecords])

  const loadYearly = useCallback(async () => {
    setYearLoading(true)
    try {
      const total = await getYearlyMcCount(employeeId, year)
      setYearlyDays(total)
      setError((current) => current)
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : '加载年度病假额度失败。'
      setError((current) => current ?? message)
      throw loadError
    } finally {
      setYearLoading(false)
    }
  }, [employeeId, year])

  const refresh = useCallback(async () => {
    const monthly = await loadMonthly().catch(() => null)
    await loadYearly().catch(() => null)
    if (monthly) {
      await applyMcToTimecards(monthly)
      const didSync = await syncTimecardsToMc(monthly)
      const didCleanup = await cleanupDuplicateRecords()
      if (didSync || didCleanup) {
        await loadMonthly().catch(() => null)
      }
    }
  }, [applyMcToTimecards, cleanupDuplicateRecords, loadMonthly, loadYearly, syncTimecardsToMc])

  refreshRef.current = refresh

  useEffect(() => {
    if (!autoLoad) {
      return
    }
    refreshRef.current
      ?.()
      .catch(() => {
        /* errors handled in loaders */
      })
  }, [autoLoad, employeeId, month])

  const mutate = useCallback(
    async (operation: () => Promise<void>) => {
      setIsMutating(true)
      setError(null)
      try {
        await operation()
        const monthly = await loadMonthly()
        await loadYearly()
        await applyMcToTimecards(monthly)
        const didCleanup = await cleanupDuplicateRecords()
        if (didCleanup) {
          const refreshed = await loadMonthly()
          await applyMcToTimecards(refreshed)
        }
        await handleRecalculate()
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : '更新病假记录失败。'
        setError(message)
        throw mutationError
      } finally {
        setIsMutating(false)
      }
    },
    [applyMcToTimecards, cleanupDuplicateRecords, handleRecalculate, loadMonthly, loadYearly],
  )

  const addRecord = useCallback(
    async (input: NewMcRecordInput) => {
      const normalizedDays = Math.max(1, Math.round(input.days))
      const willExceedQuota = yearlyDays + normalizedDays > DEFAULT_YEARLY_MC_QUOTA
      const isPaid = input.isPaid !== false && !willExceedQuota
      const existing = records.find((record) => record.date === input.date)
      if (existing) {
        await mutate(async () => {
          await deleteMcRecordByDate({ employeeId, date: input.date })
          await createMcRecord({ ...input, days: normalizedDays, isPaid, employeeId })
        })
        return
      }
      await mutate(async () => {
        await createMcRecord({ ...input, days: normalizedDays, isPaid, employeeId })
      })
    },
    [employeeId, mutate, records, yearlyDays],
  )

  const removeRecord = useCallback(
    async (id: string) => {
      await mutate(() => deleteMcRecord(id))
    },
    [mutate],
  )

  const stats = useMemo<UseMCStats>(() => {
    const quota = DEFAULT_YEARLY_MC_QUOTA
    const progress = quota ? Math.min(100, (yearlyDays / quota) * 100) : 0
    return {
      monthlyDays,
      yearlyDays,
      quota,
      quotaProgress: progress,
      quotaRemaining: Math.max(0, quota - yearlyDays),
      isQuotaExceeded: yearlyDays > quota,
    }
  }, [monthlyDays, yearlyDays])

  return {
    records,
    stats,
    isLoading: isMonthLoading,
    isYearlyLoading: isYearLoading,
    isMutating,
    error,
    refresh,
    addRecord,
    removeRecord,
  }
}

export default useMC
