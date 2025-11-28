import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DayType, type TimeRecord } from '@/types/timecard'

export type TimecardStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface TimecardSummary {
  month: string
  totalRecords: number
  totalHours: number
  overtimeHours: number
  restDayEntries: number
  publicHolidayEntries: number
  normalWorkDayEntries: number
  lastUpdatedAt: string | null
}

interface TimecardStoreState {
  recordsByMonth: Record<string, Record<string, TimeRecord>>
  statusByMonth: Record<string, TimecardStatus>
  errorByMonth: Record<string, string | null>
  summaries: Record<string, TimecardSummary>
  lastSyncedAt: Record<string, string | null>
  defaultNormalHours: number
  isOffline: boolean
  setDefaultNormalHours: (hours: number) => void
  setRecordsForMonth: (month: string, records: TimeRecord[]) => void
  upsertRecord: (record: TimeRecord) => void
  removeRecord: (date: string) => void
  loadMonth: (month: string, loader: () => Promise<TimeRecord[]>) => Promise<TimeRecord[]>
  markSynced: (month: string, isoTimestamp?: string | null) => void
  setStatus: (month: string, status: TimecardStatus) => void
  setError: (month: string, error: string | null) => void
  setOffline: (offline: boolean) => void
  clear: () => void
}

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const persistStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  return fallbackStorage
})

const getMonthKey = (date: string): string => date.slice(0, 7)

const roundToTwoDecimals = (value: number): number => Math.round(value * 100) / 100

const deriveHoursWorked = (record: TimeRecord): number => {
  if (typeof record.hoursWorked === 'number' && !Number.isNaN(record.hoursWorked)) {
    return Math.max(0, record.hoursWorked)
  }

  if (!record.actualStartTime || !record.actualEndTime) {
    return 0
  }

  const [startHours, startMinutes] = record.actualStartTime.split(':').map(Number)
  const [endHours, endMinutes] = record.actualEndTime.split(':').map(Number)

  if (
    Number.isNaN(startHours) ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endHours) ||
    Number.isNaN(endMinutes)
  ) {
    return 0
  }

  let minutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
  if (minutes < 0 || record.spansMidnight) {
    minutes += 24 * 60
  }

  const restHours = typeof record.restHours === 'number' ? record.restHours : 0
  const hoursWorked = minutes / 60 - restHours
  return Math.max(0, roundToTwoDecimals(hoursWorked))
}

const deriveOvertimeHours = (record: TimeRecord, normalHours: number, hoursWorked: number) => {
  switch (record.dayType) {
    case DayType.NORMAL_WORK_DAY:
    case DayType.REST_DAY:
    case DayType.PUBLIC_HOLIDAY:
    case DayType.OFF_DAY:
      return Math.max(0, roundToTwoDecimals(hoursWorked - normalHours))
    default:
      return 0
  }
}

const mapRecords = (records: TimeRecord[]) => {
  const map: Record<string, TimeRecord> = {}
  records.forEach((record) => {
    if (record.date) {
      map[record.date] = record
    }
  })
  return map
}

const buildSummary = (
  month: string,
  recordMap: Record<string, TimeRecord>,
  normalHours: number,
): TimecardSummary => {
  let totalHours = 0
  let overtimeHours = 0
  let restDayEntries = 0
  let publicHolidayEntries = 0
  let normalDayEntries = 0

  Object.values(recordMap).forEach((record) => {
    const hours = deriveHoursWorked(record)
    totalHours += hours
    overtimeHours += deriveOvertimeHours(record, normalHours, hours)

    if (record.dayType === DayType.REST_DAY) {
      restDayEntries += 1
    } else if (record.dayType === DayType.PUBLIC_HOLIDAY) {
      publicHolidayEntries += 1
    } else if (record.dayType === DayType.NORMAL_WORK_DAY) {
      normalDayEntries += 1
    }
  })

  return {
    month,
    totalRecords: Object.keys(recordMap).length,
    totalHours: roundToTwoDecimals(totalHours),
    overtimeHours: roundToTwoDecimals(overtimeHours),
    restDayEntries,
    publicHolidayEntries,
    normalWorkDayEntries: normalDayEntries,
    lastUpdatedAt: new Date().toISOString(),
  }
}

const buildInitialState = (): Pick<
  TimecardStoreState,
  | 'recordsByMonth'
  | 'statusByMonth'
  | 'errorByMonth'
  | 'summaries'
  | 'lastSyncedAt'
  | 'defaultNormalHours'
  | 'isOffline'
> => ({
  recordsByMonth: {},
  statusByMonth: {},
  errorByMonth: {},
  summaries: {},
  lastSyncedAt: {},
  defaultNormalHours: 8,
  isOffline: false,
})

export const useTimecardStore = create<TimecardStoreState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),
      setDefaultNormalHours: (hours) => {
        const safe = Number.isFinite(hours) && hours > 0 ? Number(hours) : get().defaultNormalHours
        set({ defaultNormalHours: roundToTwoDecimals(safe) })
      },
      setRecordsForMonth: (month, records) => {
        const recordMap = mapRecords(records)
        const summary = buildSummary(month, recordMap, get().defaultNormalHours)
        const timestamp = new Date().toISOString()
        set((state) => ({
          recordsByMonth: {
            ...state.recordsByMonth,
            [month]: recordMap,
          },
          summaries: {
            ...state.summaries,
            [month]: summary,
          },
          statusByMonth: {
            ...state.statusByMonth,
            [month]: 'ready',
          },
          errorByMonth: {
            ...state.errorByMonth,
            [month]: null,
          },
          lastSyncedAt: {
            ...state.lastSyncedAt,
            [month]: timestamp,
          },
        }))
      },
      upsertRecord: (record) => {
        if (!record.date) {
          throw new Error('TimeRecord must include a date before saving to the store.')
        }
        const month = getMonthKey(record.date)
        set((state) => {
          const monthRecords = {
            ...(state.recordsByMonth[month] ?? {}),
            [record.date]: record,
          }
          return {
            recordsByMonth: {
              ...state.recordsByMonth,
              [month]: monthRecords,
            },
            summaries: {
              ...state.summaries,
              [month]: buildSummary(month, monthRecords, state.defaultNormalHours),
            },
            statusByMonth: {
              ...state.statusByMonth,
              [month]: 'ready',
            },
            errorByMonth: {
              ...state.errorByMonth,
              [month]: null,
            },
            lastSyncedAt: {
              ...state.lastSyncedAt,
              [month]: new Date().toISOString(),
            },
          }
        })
      },
      removeRecord: (date) => {
        const month = getMonthKey(date)
        set((state) => {
          const monthRecords = { ...(state.recordsByMonth[month] ?? {}) }
          delete monthRecords[date]
          return {
            recordsByMonth: {
              ...state.recordsByMonth,
              [month]: monthRecords,
            },
            summaries: {
              ...state.summaries,
              [month]: buildSummary(month, monthRecords, state.defaultNormalHours),
            },
            lastSyncedAt: {
              ...state.lastSyncedAt,
              [month]: new Date().toISOString(),
            },
          }
        })
      },
      loadMonth: async (month, loader) => {
        set((state) => ({
          statusByMonth: { ...state.statusByMonth, [month]: 'loading' },
          errorByMonth: { ...state.errorByMonth, [month]: null },
        }))
        try {
          const records = await loader()
          get().setRecordsForMonth(month, records)
          get().setOffline(false)
          return records
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to load timecard records.'
          set((state) => ({
            statusByMonth: { ...state.statusByMonth, [month]: 'error' },
            errorByMonth: { ...state.errorByMonth, [month]: message },
            isOffline: Boolean(state.recordsByMonth[month]),
          }))
          throw error
        }
      },
      markSynced: (month, isoTimestamp = new Date().toISOString()) =>
        set((state) => ({
          lastSyncedAt: { ...state.lastSyncedAt, [month]: isoTimestamp },
        })),
      setStatus: (month, status) =>
        set((state) => ({
          statusByMonth: { ...state.statusByMonth, [month]: status },
        })),
      setError: (month, error) =>
        set((state) => ({
          errorByMonth: { ...state.errorByMonth, [month]: error },
        })),
      setOffline: (offline) => {
        if (get().isOffline === offline) {
          return
        }
        set({ isOffline: offline })
      },
      clear: () => set(buildInitialState()),
    }),
    {
      name: 'timecard-store',
      storage: persistStorage,
      partialize: (state) => ({
        recordsByMonth: state.recordsByMonth,
        summaries: state.summaries,
        lastSyncedAt: state.lastSyncedAt,
        defaultNormalHours: state.defaultNormalHours,
      }),
    },
  ),
)
