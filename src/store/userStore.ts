import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Employee, EmployeeComputed } from '@/types/employee'
import { calculateHourlyRate, calculateDailyRate } from '@/services/salary/momCompliance'
import { calculateWorkingDays } from '@/utils/dateUtils'

export type UserStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark'
  defaultMonthView: 'previous' | 'current' | 'next'
  showComplianceTips: boolean
  offlineMode: boolean
  enableNotifications: boolean
  locale: string
  timeFormat: '24h' | '12h'
  calendarViewMode: 'month' | 'week'
}

export interface PartIVState {
  isApplicable: boolean
  overrideReason: string | null
  overrideSource: 'system' | 'manual'
  lastEvaluatedAt: string | null
}

interface UserStoreState {
  profile: Employee | null
  computed: EmployeeComputed | null
  preferences: UserPreferences
  partIV: PartIVState
  status: UserStoreStatus
  error: string | null
  lastSyncedAt: string | null
  setProfile: (profile: Employee) => void
  updateProfile: (partial: Partial<Employee>) => void
  updatePreferences: (partial: Partial<UserPreferences>) => void
  overridePartIV: (isApplicable: boolean, reason?: string | null) => void
  loadProfile: (loader: () => Promise<Employee | null>) => Promise<Employee | null>
  setStatus: (status: UserStoreStatus, error?: string | null) => void
  clearProfile: () => void
  clear: () => void
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  defaultMonthView: 'current',
  showComplianceTips: true,
  offlineMode: true,
  enableNotifications: false,
  locale: 'zh-SG',
  timeFormat: '24h',
  calendarViewMode: 'month',
}

const defaultPartIV: PartIVState = {
  isApplicable: true,
  overrideReason: null,
  overrideSource: 'system',
  lastEvaluatedAt: null,
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

const buildComputedProfile = (profile: Employee): EmployeeComputed => {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const monthlyWorkingDays = calculateWorkingDays(year, month, profile.workScheduleType)

  return {
    ...profile,
    hourlyRate: calculateHourlyRate(profile.baseSalary),
    dailyRate: calculateDailyRate({
      baseSalary: profile.baseSalary,
      year,
      month,
      scheduleType: profile.workScheduleType,
    }),
    monthlyWorkingDays,
  }
}

const initialState: Pick<
  UserStoreState,
  'profile' | 'computed' | 'preferences' | 'partIV' | 'status' | 'error' | 'lastSyncedAt'
> = {
  profile: null,
  computed: null,
  preferences: defaultPreferences,
  partIV: defaultPartIV,
  status: 'idle',
  error: null,
  lastSyncedAt: null,
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setProfile: (profile) => {
        const timestamp = new Date().toISOString()
        const computed = buildComputedProfile(profile)
        set({
          profile,
          computed,
          partIV: {
            isApplicable: profile.isPartIVApplicable,
            overrideReason: null,
            overrideSource: 'system',
            lastEvaluatedAt: timestamp,
          },
          status: 'ready',
          error: null,
          lastSyncedAt: timestamp,
        })
      },
      updateProfile: (partial) => {
        const current = get().profile
        if (!current) {
          return
        }
        const nextProfile = { ...current, ...partial }
        get().setProfile(nextProfile)
      },
      updatePreferences: (partial) =>
        set((state) => ({
          preferences: { ...state.preferences, ...partial },
        })),
      overridePartIV: (isApplicable, reason = null) =>
        set((state) => ({
          partIV: {
            isApplicable,
            overrideReason: reason,
            overrideSource: 'manual',
            lastEvaluatedAt: new Date().toISOString(),
          },
          profile: state.profile
            ? {
                ...state.profile,
                isPartIVApplicable: isApplicable,
              }
            : null,
          computed: state.computed
            ? {
                ...state.computed,
                isPartIVApplicable: isApplicable,
              }
            : null,
        })),
      loadProfile: async (loader) => {
        set({ status: 'loading', error: null })
        try {
          const profile = await loader()
          if (profile) {
            get().setProfile(profile)
          } else {
            set({ profile: null, computed: null, status: 'idle', lastSyncedAt: null })
          }
          return profile
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '加载员工资料失败。'
          set({ status: 'error', error: message })
          throw error
        }
      },
      setStatus: (status, error = null) => set({ status, error }),
      clearProfile: () =>
        set({
          profile: null,
          computed: null,
          partIV: { ...defaultPartIV },
          status: 'idle',
          error: null,
          lastSyncedAt: null,
        }),
      clear: () =>
        set({
          ...initialState,
          preferences: { ...defaultPreferences },
          partIV: { ...defaultPartIV },
        }),
    }),
    {
      name: 'user-store',
      storage: persistStorage,
      partialize: (state) => ({
        profile: state.profile,
        computed: state.computed,
        preferences: state.preferences,
        partIV: state.partIV,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
)
