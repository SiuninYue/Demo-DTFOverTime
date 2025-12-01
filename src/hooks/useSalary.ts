import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOM_MONTHLY_OVERTIME_LIMIT } from '@/config/constants'
import { useTimecardStore } from '@/store/timecardStore'
import { useUserStore } from '@/store/userStore'
import { calculateMonthlySummary } from '@/services/salary/calculator'
import type { SalaryResult } from '@/types/salary'
import type { TimeRecord } from '@/types/timecard'
import { getMonthlyRecords } from '@/services/supabase/timeRecords'
import {
  type MonthlySalarySummary,
  getMonthlySummary as fetchMonthlySummary,
  upsertMonthlySummary,
} from '@/services/supabase/monthlySalaries'
import { getMonthlyMcDays } from '@/services/supabase/mcRecords'
import { exportSalaryCsv, exportSalaryPdf, type SalaryExportData } from '@/utils/exportSalary'
import { CalculationMode, WorkScheduleType, type Employee } from '@/types/employee'

export interface SalaryOverview {
  month: string
  monthLabel: string
  employeeName: string
  result: SalaryResult
  mcDays: number
  recordedDays: number
  totalWorkingDays: number
  progressPercent: number
  countdown: {
    payDateISO: string
    daysUntil: number
    label: string
  }
  overtimeLimit: number
  overtimePercent: number
  source: 'calculated' | 'cached'
  lastSyncedAt: string | null
}

export interface UseSalaryResult {
  summary?: SalaryOverview
  isLoading: boolean
  isPersisting: boolean
  isRefreshing: boolean
  error?: string | null
  refresh: () => Promise<void>
  exportCsv: () => void
  exportPdf: () => void
}

export interface UseSalaryOptions {
  employeeId: string
  month: string
  autoPersist?: boolean
}

const msPerDay = 1000 * 60 * 60 * 24
const UNPAID_LEAVE_TAG = '[UNPAID_LEAVE]'

const buildMonthMeta = (value: string) => {
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (!match) {
    const now = new Date()
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return buildMonthMeta(fallback)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const label = new Intl.DateTimeFormat('en-SG', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
  return { key: `${year}-${String(month).padStart(2, '0')}`, year, month, label }
}

const computePayDate = (year: number, month: number, payDay: number): Date => {
  const normalizedPayDay = Math.max(1, Math.min(31, payDay))
  const payoutMonthIndex = month === 12 ? 0 : month
  const payoutYear = month === 12 ? year + 1 : year
  const daysInTargetMonth = new Date(Date.UTC(payoutYear, payoutMonthIndex + 1, 0)).getUTCDate()
  const safeDay = Math.min(normalizedPayDay, daysInTargetMonth)
  return new Date(Date.UTC(payoutYear, payoutMonthIndex, safeDay))
}

const formatCountdown = (payDate: Date): { payDateISO: string; daysUntil: number; label: string } => {
  const diffDays = Math.ceil((payDate.getTime() - Date.now()) / msPerDay)
  const daysUntil = Math.max(0, diffDays)
  let label = 'Payday today'
  if (daysUntil > 0) {
    label = daysUntil === 1 ? '1 day until payday' : `${daysUntil} days until payday`
  } else if (diffDays < 0) {
    label = 'Salary paid'
  }
  return { payDateISO: payDate.toISOString().slice(0, 10), daysUntil, label }
}

const fallbackProfile: Employee = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@dtf.sg',
  name: 'Demo Employee',
  baseSalary: 1770,
  attendanceBonus: 200,
  workScheduleType: WorkScheduleType.FIVE_DAY,
  normalWorkHours: 8,
  defaultRestHours: 1,
  isWorkman: true,
  isPartIVApplicable: true,
  payDay: 7,
  calculationMode: CalculationMode.FULL_COMPLIANCE,
}

const buildCachedResult = (
  remote: MonthlySalarySummary,
  scheduleType: WorkScheduleType,
): SalaryResult => {
  const calculationDetails =
    remote.calculationDetails ??
    {
      hourlyRate: 0,
      dailyRate: 0,
      monthlyWorkingDays: 0,
      workScheduleType: scheduleType,
      totalOvertimeHours: 0,
      totalRestDayHours: 0,
      totalPHHours: 0,
    }

  return {
    baseSalary: remote.baseSalary,
    attendanceBonus: remote.attendanceBonus,
    overtimePay: remote.overtimePay,
    publicHolidayPay: remote.publicHolidayPay,
    restDayPay: remote.restDayPay,
    deductions: remote.deductions,
    totalGross: remote.totalGross,
    netPay: remote.totalGross - remote.deductions,
    breakdown: [],
    compliance: {
      isCompliant: true,
      warnings: [],
    },
    calculationDetails,
  }
}

const buildExportPayload = (summary: SalaryOverview): SalaryExportData => ({
  month: summary.month,
  monthLabel: summary.monthLabel,
  employeeName: summary.employeeName,
  recordedDays: summary.recordedDays,
  totalWorkingDays: summary.totalWorkingDays,
  mcDays: summary.mcDays,
  countdownLabel: summary.countdown.label,
  result: summary.result,
})

export const useSalary = ({
  employeeId,
  month,
  autoPersist = true,
}: UseSalaryOptions): UseSalaryResult => {
  const normalizedMonth = useMemo(() => buildMonthMeta(month), [month])
  const profile = useUserStore((state) => state.profile) ?? fallbackProfile
  const lastSyncedAt = useTimecardStore(
    (state) => state.lastSyncedAt[normalizedMonth.key] ?? null,
  )
  const loadMonthRecords = useTimecardStore((state) => state.loadMonth)
  const recordsByMonth = useTimecardStore((state) => state.recordsByMonth[normalizedMonth.key])
  const timecardStatus = useTimecardStore(
    (state) => state.statusByMonth[normalizedMonth.key] ?? ('idle' as const),
  )
  const timecardError = useTimecardStore((state) => state.errorByMonth[normalizedMonth.key] ?? null)

  const [mcDays, setMcDays] = useState(0)
  const [mcLoading, setMcLoading] = useState(true)
  const [mcError, setMcError] = useState<string | null>(null)
  const [remoteSummary, setRemoteSummary] = useState<MonthlySalarySummary | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(true)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [calcResult, setCalcResult] = useState<SalaryResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(true)
  const [calcError, setCalcError] = useState<string | null>(null)
  const [isPersisting, setIsPersisting] = useState(false)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const recordsRequestedRef = useRef(false)
  const lastPersistSignature = useRef<string | null>(null)

  useEffect(() => {
    lastPersistSignature.current = null
  }, [employeeId, normalizedMonth.key])

  const records: TimeRecord[] = useMemo(() => {
    const map = recordsByMonth ?? {}
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [recordsByMonth])

  const unpaidLeaveDays = useMemo(
    () => records.filter((record) => record.notes?.includes(UNPAID_LEAVE_TAG)).length,
    [records],
  )

  useEffect(() => {
    recordsRequestedRef.current = false
  }, [normalizedMonth.key])

  useEffect(() => {
    if (records.length || recordsRequestedRef.current || timecardStatus === 'loading') {
      return
    }
    recordsRequestedRef.current = true
    loadMonthRecords(normalizedMonth.key, () => getMonthlyRecords(employeeId, normalizedMonth.key))
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Failed to load timecard records.'
        setCalcError((current) => current ?? message)
      })
      .finally(() => {
        recordsRequestedRef.current = false
      })
  }, [employeeId, loadMonthRecords, normalizedMonth.key, records.length, timecardStatus])

  useEffect(() => {
    let active = true
    setMcLoading(true)
    setMcError(null)
    getMonthlyMcDays(employeeId, normalizedMonth.key)
      .then((value) => {
        if (active) {
          setMcDays(value)
        }
      })
      .catch((error) => {
        if (active) {
          setMcError(error instanceof Error ? error.message : 'Failed to load MC records.')
          setMcDays(0)
        }
      })
      .finally(() => {
        if (active) {
          setMcLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [employeeId, normalizedMonth.key])

  useEffect(() => {
    let active = true
    setRemoteLoading(true)
    setRemoteError(null)
    fetchMonthlySummary(employeeId, normalizedMonth.key)
      .then((record) => {
        if (active) {
          setRemoteSummary(record)
        }
      })
      .catch((error) => {
        if (active) {
          setRemoteError(error instanceof Error ? error.message : 'Failed to load salary cache.')
          setRemoteSummary(null)
        }
      })
      .finally(() => {
        if (active) {
          setRemoteLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [employeeId, normalizedMonth.key])

  useEffect(() => {
    const perfLabel = `salary:calc:${normalizedMonth.key}`
    if (import.meta.env?.DEV) {
      console.time(perfLabel)
    }
    setCalcLoading(true)
    setCalcError(null)
    try {
      const result = calculateMonthlySummary({
        records,
        baseSalary: profile.baseSalary,
        attendanceBonus: profile.attendanceBonus,
        mcDays,
        unpaidLeaveDays,
        workScheduleType: profile.workScheduleType,
        normalWorkHours: profile.normalWorkHours,
        year: normalizedMonth.year,
        month: normalizedMonth.month,
      })
      setCalcResult(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate salary summary.'
      setCalcResult(null)
      setCalcError(message)
    } finally {
      setCalcLoading(false)
      if (import.meta.env?.DEV) {
        console.timeEnd(perfLabel)
      }
    }
  }, [records, profile, mcDays, unpaidLeaveDays, normalizedMonth.key, normalizedMonth.month, normalizedMonth.year])

  const summary: SalaryOverview | undefined = useMemo(() => {
    const result =
      calcResult ?? (remoteSummary ? buildCachedResult(remoteSummary, profile.workScheduleType) : null)
    if (!result) {
      return undefined
    }
    const totalWorkingDays = result.calculationDetails.monthlyWorkingDays || 0
    const recordedDays = records.length
    const progressPercent = totalWorkingDays
      ? Math.min(100, (recordedDays / totalWorkingDays) * 100)
      : 0
    const payDate = computePayDate(normalizedMonth.year, normalizedMonth.month, profile.payDay ?? 7)
    const countdown = formatCountdown(payDate)
    const overtimePercent = MOM_MONTHLY_OVERTIME_LIMIT
      ? Math.min(
          100,
          (result.calculationDetails.totalOvertimeHours / MOM_MONTHLY_OVERTIME_LIMIT) * 100,
        )
      : 0
    const source: SalaryOverview['source'] = calcResult ? 'calculated' : 'cached'
    const derivedLastSynced = calcResult ? lastSyncedAt : remoteSummary?.updatedAt ?? lastSyncedAt

    return {
      month: normalizedMonth.key,
      monthLabel: normalizedMonth.label,
      employeeName: profile.name || 'Unnamed Employee',
      result,
      mcDays,
      recordedDays,
      totalWorkingDays,
      progressPercent,
      countdown,
      overtimeLimit: MOM_MONTHLY_OVERTIME_LIMIT,
      overtimePercent,
      source,
      lastSyncedAt: derivedLastSynced,
    }
  }, [
    calcResult,
    mcDays,
    normalizedMonth,
    profile.name,
    profile.payDay,
    profile.workScheduleType,
    records.length,
    remoteSummary,
    lastSyncedAt,
  ])

  useEffect(() => {
    if (!autoPersist || !summary) {
      return
    }
    const signature = JSON.stringify({
      month: summary.month,
      total: summary.result.totalGross,
      net: summary.result.netPay,
      overtime: summary.result.overtimePay,
      recordedDays: summary.recordedDays,
      mcDays: summary.mcDays,
    })
    if (lastPersistSignature.current === signature) {
      return
    }

    let cancelled = false
    setIsPersisting(true)
    setPersistError(null)
    upsertMonthlySummary({
      employeeId,
      month: summary.month,
      summary: summary.result,
      estimatedPayDate: summary.countdown.payDateISO,
    })
      .then((record) => {
        if (cancelled) {
          return
        }
        lastPersistSignature.current = signature
        setRemoteSummary(record)
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        const message =
          error instanceof Error ? error.message : 'Failed to save salary summary.'
        const isRlsBlocked = message.toLowerCase().includes('row-level security')
        if (isRlsBlocked) {
          // Frontend anon key cannot bypass RLS; avoid spamming the UI and retry only when data changes.
          lastPersistSignature.current = signature
          setPersistError(null)
          console.warn('Monthly salary upsert skipped due to RLS; configure policies or use a service role.')
          return
        }
        setPersistError(message)
      })
      .finally(() => {
        if (!cancelled) {
          setIsPersisting(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [autoPersist, employeeId, summary])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const results = await Promise.allSettled([
        loadMonthRecords(normalizedMonth.key, () =>
          getMonthlyRecords(employeeId, normalizedMonth.key),
        ),
        fetchMonthlySummary(employeeId, normalizedMonth.key).then((record) => {
          setRemoteSummary(record)
          return record
        }),
        getMonthlyMcDays(employeeId, normalizedMonth.key).then((value) => {
          setMcDays(value)
          return value
        }),
      ])

      const rejected = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (rejected) {
        const reason = rejected.reason
        const message = reason instanceof Error ? reason.message : 'Refresh failed.'
        setCalcError(message)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [employeeId, loadMonthRecords, normalizedMonth.key])

  const exportCsv = useCallback(() => {
    if (!summary) {
      return
    }
    exportSalaryCsv(buildExportPayload(summary))
  }, [summary])

  const exportPdf = useCallback(() => {
    if (!summary) {
      return
    }
    exportSalaryPdf(buildExportPayload(summary))
  }, [summary])

  const aggregatedError = calcError || timecardError || remoteError || mcError || persistError
  const isLoading =
    calcLoading || remoteLoading || mcLoading || timecardStatus === 'loading' || isRefreshing

  return {
    summary,
    isLoading,
    isPersisting,
    isRefreshing,
    error: aggregatedError,
    refresh,
    exportCsv,
    exportPdf,
  }
}

export const DEMO_EMPLOYEE_ID = fallbackProfile.id
