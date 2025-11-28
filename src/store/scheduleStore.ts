import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Schedule } from '@/types/schedule'

export type ScheduleStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ScheduleStoreState {
  schedules: Record<string, Schedule>
  statusByMonth: Record<string, ScheduleStatus>
  lastSyncedAt: Record<string, string | null>
  errorByMonth: Record<string, string | null>
  isOffline: boolean
  setSchedule: (schedule: Schedule) => void
  removeSchedule: (month: string) => void
  hydrate: (entries: Schedule[]) => void
  getSchedule: (month: string) => Schedule | undefined
  setStatus: (month: string, status: ScheduleStatus) => void
  setError: (month: string, error: string | null) => void
  markSynced: (month: string, isoTimestamp?: string | null) => void
  setOffline: (offline: boolean) => void
  clear: () => void
}

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const buildInitialState = (): Pick<
  ScheduleStoreState,
  'schedules' | 'statusByMonth' | 'lastSyncedAt' | 'errorByMonth' | 'isOffline'
> => ({
  schedules: {},
  statusByMonth: {},
  lastSyncedAt: {},
  errorByMonth: {},
  isOffline: false,
})

const persistStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }
  return fallbackStorage
})

export const useScheduleStore = create<ScheduleStoreState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),
      setSchedule: (schedule) => {
        const timestamp = new Date().toISOString()
        set((state) => ({
          schedules: {
            ...state.schedules,
            [schedule.month]: schedule,
          },
          statusByMonth: {
            ...state.statusByMonth,
            [schedule.month]: 'ready',
          },
          lastSyncedAt: {
            ...state.lastSyncedAt,
            [schedule.month]: timestamp,
          },
          errorByMonth: {
            ...state.errorByMonth,
            [schedule.month]: null,
          },
        }))
      },
      removeSchedule: (month) =>
        set((state) => {
          const { [month]: _, ...restSchedules } = state.schedules
          const { [month]: __, ...restStatus } = state.statusByMonth
          const { [month]: ___, ...restErrors } = state.errorByMonth
          const { [month]: ____, ...restSynced } = state.lastSyncedAt

          return {
            schedules: restSchedules,
            statusByMonth: restStatus,
            errorByMonth: restErrors,
            lastSyncedAt: restSynced,
          }
        }),
      hydrate: (entries) => {
        if (!entries.length) {
          return
        }
        set((state) => {
          const timestamp = new Date().toISOString()
          const nextSchedules = { ...state.schedules }
          const nextStatuses = { ...state.statusByMonth }
          const nextErrors = { ...state.errorByMonth }
          const nextSynced = { ...state.lastSyncedAt }

          entries.forEach((schedule) => {
            nextSchedules[schedule.month] = schedule
            nextStatuses[schedule.month] = 'ready'
            nextErrors[schedule.month] = null
            nextSynced[schedule.month] = timestamp
          })

          return {
            schedules: nextSchedules,
            statusByMonth: nextStatuses,
            errorByMonth: nextErrors,
            lastSyncedAt: nextSynced,
          }
        })
      },
      getSchedule: (month) => get().schedules[month],
      setStatus: (month, status) =>
        set((state) => ({
          statusByMonth: {
            ...state.statusByMonth,
            [month]: status,
          },
        })),
      setError: (month, error) =>
        set((state) => ({
          errorByMonth: {
            ...state.errorByMonth,
            [month]: error,
          },
        })),
      markSynced: (month, isoTimestamp = new Date().toISOString()) =>
        set((state) => ({
          lastSyncedAt: {
            ...state.lastSyncedAt,
            [month]: isoTimestamp,
          },
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
      name: 'schedule-store',
      storage: persistStorage,
      partialize: (state) => ({
        schedules: state.schedules,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
)
