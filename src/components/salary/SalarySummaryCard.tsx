import type { SalaryOverview } from '@/hooks/useSalary'
import { formatCurrency } from '@/utils/formatting'

interface SalarySummaryCardProps {
  summary?: SalaryOverview
  isLoading?: boolean
  isPersisting?: boolean
  onViewDetails?: () => void
}

const formatTimestamp = (value?: string | null): string => {
  if (!value) {
    return 'Not synced yet'
  }
  try {
    return new Intl.DateTimeFormat('en-SG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function SalarySummaryCard({ summary, isLoading, isPersisting, onViewDetails }: SalarySummaryCardProps) {
  const total = summary ? formatCurrency(summary.result.netPay) : '--'
  const base = summary ? formatCurrency(summary.result.baseSalary) : '--'
  const attendance = summary ? formatCurrency(summary.result.attendanceBonus) : '--'
  const overtime = summary ? formatCurrency(summary.result.overtimePay) : '--'
  const deductions = summary ? formatCurrency(summary.result.deductions) : '--'
  const attendanceImpact = summary?.result.calculationDetails.attendanceBonusImpact
  const attendanceContext = attendanceImpact
    ? `${formatCurrency(attendanceImpact.actualAmount)} of ${formatCurrency(attendanceImpact.fullAmount)}`
    : attendance
  const progressPercent = summary ? Math.min(100, summary.progressPercent) : 0
  const progressLabel = summary
    ? `${summary.recordedDays}/${summary.totalWorkingDays || '--'} days logged`
    : 'Waiting for timecards'
  const countdown = summary?.countdown.label ?? 'Configure payday in Settings'
  const lastSyncedLabel = formatTimestamp(summary?.lastSyncedAt)

  return (
    <section className="salary-summary-card">
      <header className="salary-summary-card__header">
        <div>
          <p className="text-muted">Salary overview</p>
          <h2>{summary?.monthLabel ?? 'Pending setup'}</h2>
        </div>
        <div className="salary-summary-card__status">
          {isPersisting && <span className="salary-pill">Syncing…</span>}
          {!isPersisting && summary && <span className="salary-pill salary-pill--success">Up to date</span>}
        </div>
      </header>

      <div className="salary-summary-card__total">
        <p className="label">Estimated total (net)</p>
        <p className="value">{isLoading ? 'Calculating…' : total}</p>
      </div>

      <div className="salary-summary-card__breakdown">
        <div>
          <p className="label">Base</p>
          <p className="value">{base}</p>
        </div>
        <div>
          <p className="label">Attendance</p>
          <p className="value">{attendance}</p>
        </div>
        <div>
          <p className="label">Overtime</p>
          <p className="value">{overtime}</p>
        </div>
        <div>
          <p className="label">Deductions</p>
          <p className="value">{deductions}</p>
        </div>
      </div>

      {summary && (
        <div className="salary-summary-card__notice">
          <div>
            <p className="label">MC impact</p>
            <p>
              {summary.mcDays} MC day{summary.mcDays === 1 ? '' : 's'} ·{' '}
              {attendanceImpact?.reason ?? 'Full attendance bonus applied'}
            </p>
          </div>
          <strong>{attendanceContext}</strong>
        </div>
      )}

      <div className="salary-summary-card__progress">
        <div className="salary-summary-card__progress-bar" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="salary-summary-card__progress-meta">
          <p>{progressLabel}</p>
          <p>{countdown}</p>
        </div>
      </div>

      <footer className="salary-summary-card__footer">
        <div>
          <p className="text-muted">{lastSyncedLabel}</p>
        </div>
        {onViewDetails && (
          <button type="button" className="secondary" onClick={onViewDetails} disabled={isLoading}>
            View details
          </button>
        )}
      </footer>
    </section>
  )
}

export default SalarySummaryCard
