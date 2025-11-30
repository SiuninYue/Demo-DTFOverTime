import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SalarySummaryCard from '@/components/salary/SalarySummaryCard'
import SalaryBreakdown from '@/components/salary/SalaryBreakdown'
import OvertimeWarning from '@/components/salary/OvertimeWarning'
import { useSalary, DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/utils/formatting'
import { useAuthStore } from '@/store/authStore'

const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getTodayKey = () => new Date().toISOString().slice(0, 10)

function HomePage() {
  const navigate = useNavigate()
  const month = getCurrentMonthKey()
  const salaryRoute = `/salary/${month}`
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const { summary, isLoading, isPersisting, error, refresh } = useSalary({
    employeeId,
    month,
  })
  const scheduleState = useSchedule({ employeeId, month, autoFetch: true })

  useEffect(() => {
    refresh()
    scheduleState.refresh()
    // intentionally run once on entry to keep data fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upcomingEntries = useMemo(() => {
    const schedule = scheduleState.schedule
    if (!schedule) {
      return []
    }
    const todayKey = getTodayKey()
    return Object.entries(schedule.scheduleData)
      .filter(([date]) => date >= todayKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
      .map(([date, entry]) => ({ date, entry }))
  }, [scheduleState.schedule])

  const quickActions = [
    { label: 'Import roster', action: () => navigate('/schedule/import'), className: 'secondary' },
    { label: 'Record today', action: () => navigate(`/timecard/${getTodayKey()}`), className: 'button' },
  ]

  return (
    <section className="home-page">
      {error && <p className="upload-error">Error: {error}</p>}
      {scheduleState.error && <p className="upload-error">Error: {scheduleState.error}</p>}

      <div className="home-grid">
        <div className="home-grid__main">
          <SalarySummaryCard
            summary={summary}
            isLoading={isLoading}
            isPersisting={isPersisting}
            onViewDetails={() => navigate(salaryRoute)}
          />

          <div className="home-secondary-grid">
            <SalaryBreakdown summary={summary} isLoading={isLoading} variant="compact" />
            <OvertimeWarning summary={summary} />
          </div>
        </div>

        <aside className="home-grid__sidebar">
          <div className="home-card">
            <div className="home-card__header">
              <h3>Quick actions</h3>
            </div>
            <div className="home-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={action.className}
                  onClick={action.action}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="home-card">
            <div className="home-card__header">
              <h3>Upcoming schedule</h3>
              {scheduleState.isLoading && <span className="text-muted">Syncing...</span>}
            </div>
            {!upcomingEntries.length && !scheduleState.isLoading && (
              <p className="text-muted">No upcoming shifts on file. Import a roster to populate this list.</p>
            )}
            <ul className="home-calendar-list">
              {upcomingEntries.map(({ date, entry }) => (
                <li key={date}>
                  <div>
                    <p className="home-calendar-list__date">{formatDate(date, { format: 'medium' })}</p>
                    <small className="text-muted">{entry?.type ?? '—'}</small>
                  </div>
                  <div className="home-calendar-list__slot">
                    {entry?.plannedStartTime ? `${entry.plannedStartTime} — ${entry?.plannedEndTime ?? '--'}` : '—'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default HomePage
