import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type MCRecord,
  type CreateMcRecordInput,
  createMcRecord,
  deleteMcRecord,
  getMonthlyMcRecords,
  getYearlyMcCount,
} from '@/services/supabase/mcRecords'
import { upsertMcDates, getMonthlyRecords } from '@/services/supabase/timeRecords'
import { useTimecardStore } from '@/store/timecardStore'
import { useScheduleStore } from '@/store/scheduleStore'
import type { TimeRecord } from '@/types/timecard'

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
  const refreshRef = useRef<() => Promise<void>>()
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
      setRecords(data)
      const total = data.reduce((acc, record) => acc + Math.max(0, record.days), 0)
      setMonthlyDays(total)
      setError(null)
      return data
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load MC records.'
      setError(message)
      throw loadError
    } finally {
      setMonthLoading(false)
    }
  }, [employeeId, month])

  const loadYearly = useCallback(async () => {
    setYearLoading(true)
    try {
      const total = await getYearlyMcCount(employeeId, year)
      setYearlyDays(total)
      setError((current) => current)
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load yearly MC quota.'
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
    }
  }, [applyMcToTimecards, loadMonthly, loadYearly])

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
        await handleRecalculate()
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : 'Failed to update MC records.'
        setError(message)
        throw mutationError
      } finally {
        setIsMutating(false)
      }
    },
    [applyMcToTimecards, handleRecalculate, loadMonthly, loadYearly],
  )

  const addRecord = useCallback(
    async (input: NewMcRecordInput) => {
      const normalizedDays = Math.max(1, Math.round(input.days))
      const willExceedQuota = yearlyDays + normalizedDays > DEFAULT_YEARLY_MC_QUOTA
      const isPaid = input.isPaid !== false && !willExceedQuota
      await mutate(() => createMcRecord({ ...input, days: normalizedDays, isPaid, employeeId }))
    },
    [employeeId, mutate, yearlyDays],
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
