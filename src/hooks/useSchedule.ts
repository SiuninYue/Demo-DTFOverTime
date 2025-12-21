import { useCallback, useEffect, useMemo, useState } from 'react'
import { useScheduleStore } from '@/store/scheduleStore'
import type { Schedule } from '@/types/schedule'
import { getScheduleByMonth } from '@/services/supabase/database'

export interface UseScheduleOptions {
  employeeId: string
  month: string
  autoFetch?: boolean
}

export interface ScheduleHookState {
  schedule?: Schedule | null
  isLoading: boolean
  error?: string | null
  isOffline: boolean
  refresh: () => Promise<void>
  hasData: boolean
}

const normalizeMonth = (month: string) => {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return month
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useSchedule = ({
  employeeId,
  month,
  autoFetch = true,
}: UseScheduleOptions): ScheduleHookState => {
  const normalizedMonth = normalizeMonth(month)
  const schedule = useScheduleStore((state) => state.schedules[normalizedMonth])
  const status = useScheduleStore(
    (state) => state.statusByMonth[normalizedMonth] ?? ('idle' as const),
  )
  const storeError = useScheduleStore((state) => state.errorByMonth[normalizedMonth] ?? null)
  const setSchedule = useScheduleStore((state) => state.setSchedule)
  const setStatus = useScheduleStore((state) => state.setStatus)
  const setError = useScheduleStore((state) => state.setError)
  const setOffline = useScheduleStore((state) => state.setOffline)
  const isOffline = useScheduleStore((state) => state.isOffline)

  const fetchSchedule = useCallback(async () => {
    if (!autoFetch) {
      return
    }

    setStatus(normalizedMonth, 'loading')
    setError(normalizedMonth, null)

    try {
      const scheduleData = await getScheduleByMonth(employeeId, normalizedMonth)
      if (scheduleData) {
        setSchedule(scheduleData)
        setOffline(false)
      } else {
        setStatus(normalizedMonth, 'ready')
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : '加载排班数据失败。'
      setError(normalizedMonth, message)
      setOffline(Boolean(schedule))
    }
  }, [autoFetch, employeeId, normalizedMonth, schedule, setError, setOffline, setSchedule, setStatus])

  useEffect(() => {
    if (!autoFetch) {
      return
    }
    if (!schedule && status === 'idle') {
      fetchSchedule()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, schedule, normalizedMonth, status])

  return {
    schedule: useMemo(() => schedule ?? null, [schedule]),
    isLoading: status === 'loading',
    error: storeError,
    isOffline,
    hasData: Boolean(schedule),
    refresh: fetchSchedule,
  }
}
