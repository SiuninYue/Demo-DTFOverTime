import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PullToRefresh from '@/components/common/PullToRefresh'
import SalarySummaryCard from '@/components/salary/SalarySummaryCard'

import { useSalary, DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useSchedule } from '@/hooks/useSchedule'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/formatting'

const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getTodayKey = () => new Date().toISOString().slice(0, 10)

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-6 h-4 w-32 rounded bg-slate-100" />
    <div className="mb-2 h-8 w-48 rounded bg-slate-100" />
    <div className="space-y-3">
      <div className="h-3 rounded bg-slate-100" />
      <div className="h-3 rounded bg-slate-100" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
    </div>
  </div>
)

const SkeletonListItem = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm animate-pulse">
    <div className="h-12 w-12 rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/3 rounded bg-slate-100" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
    </div>
  </div>
)

function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const month = getCurrentMonthKey()
  const salaryRoute = `/salary/${month}`
  const employeeId = user?.id ?? DEMO_EMPLOYEE_ID
  const todayKey = getTodayKey()

  const {
    summary,
    isLoading,
    isPersisting,
    error,
    refresh: refreshSalary,
  } = useSalary({
    employeeId,
    month,
  })
  const {
    schedule,
    refresh: refreshSchedule,
    isLoading: isScheduleLoading,
    error: scheduleError,
  } = useSchedule({ employeeId, month, autoFetch: true })

  useEffect(() => {
    Promise.all([refreshSalary(), refreshSchedule()]).catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upcomingEntries = useMemo(() => {
    if (!schedule) return []
    return Object.entries(schedule.scheduleData)
      .filter(([date]) => date >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
  }, [schedule, todayKey])

  const todaySchedule = useMemo(() => schedule?.scheduleData[todayKey], [schedule, todayKey])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning ☀️'
    if (hour < 18) return 'Good afternoon 🌤️'
    return 'Good evening 🌙'
  }, [])

  const handleRefresh = async () => {
    await Promise.all([refreshSalary(), refreshSchedule()])
  }

  const displayName = user?.email?.split('@')[0] ?? 'Staff'

  return (
    <PullToRefresh onRefresh={handleRefresh} className="bg-slate-50">
      <section className="min-h-screen px-4 py-6 pb-28 md:px-6 md:pb-16">
        <div className="mx-auto max-w-4xl space-y-6">
          {(error || scheduleError) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
              <strong className="font-semibold">Heads up: </strong>
              {error ?? scheduleError}
            </div>
          )}

          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{greeting}</p>
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-lg font-semibold text-brand-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              aria-label="Open settings"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </header>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => navigate(`/timecard/${todayKey}`)}
              className="flex w-full flex-col gap-4 text-left transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                  Today · {formatDate(todayKey, { format: 'medium' })}
                </span>
                <span className="text-slate-400">→</span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={[
                    'flex h-12 w-12 items-center justify-center rounded-xl text-2xl',
                    todaySchedule ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {todaySchedule ? '⏰' : '🏖️'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {todaySchedule
                      ? `${todaySchedule.plannedStartTime ?? '--:--'} → ${todaySchedule.plannedEndTime ?? '--:--'}`
                      : 'No shift scheduled'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {todaySchedule ? 'Tap to review or log out' : 'Tap to add OT or a quick note'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-900">Current month</h2>
              <button
                type="button"
                onClick={() => navigate(salaryRoute)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-500"
              >
                View details
              </button>
            </div>
            <button
              onClick={() => navigate(salaryRoute)}
              className="w-full text-left overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition active:scale-[0.99]"
            >
              {isLoading ? (
                <SkeletonCard />
              ) : (
                <SalarySummaryCard
                  summary={summary}
                  isLoading={isLoading}
                  isPersisting={isPersisting}
                />
              )}
            </button>

          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule</p>
                <h3 className="text-lg font-bold text-slate-900">Coming up</h3>
              </div>

            </div>
            <div className="space-y-3">
              {isScheduleLoading && (
                <>
                  <SkeletonListItem />
                  <SkeletonListItem />
                </>
              )}
              {!isScheduleLoading && upcomingEntries.length === 0 && (
                <div className="py-4 text-center text-sm text-slate-500">
                  No upcoming shifts
                </div>
              )}
              {!isScheduleLoading &&
                upcomingEntries.map(([date, entry]) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => navigate(`/timecard/${date}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(date, { format: 'medium' })}
                      </p>
                      <p className="text-xs text-slate-500">{entry?.type ?? 'No type recorded'}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {entry?.plannedStartTime
                        ? `${entry.plannedStartTime} → ${entry?.plannedEndTime ?? '--:--'}`
                        : '--'}
                    </div>
                  </button>
                ))}
            </div>
          </div>


        </div>
      </section>
    </PullToRefresh>
  )
}

export default HomePage
