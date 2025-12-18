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
    return '尚未同步'
  }
  try {
    return new Intl.DateTimeFormat('zh-SG', {
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
    ? `${formatCurrency(attendanceImpact.actualAmount)} / ${formatCurrency(attendanceImpact.fullAmount)}`
    : attendance
  const progressPercent = summary ? Math.min(100, summary.progressPercent) : 0
  const progressLabel = summary
    ? `已记录 ${summary.recordedDays}/${summary.totalWorkingDays || '--'} 天`
    : '等待打卡记录'
  const countdown = summary?.countdown.label ?? '请在设置中配置发薪日'
  const lastSyncedLabel = formatTimestamp(summary?.lastSyncedAt)

  return (
    <section className="salary-summary-card">
      <header className="salary-summary-card__header">
        <div>
          <p className="text-muted">工资概览</p>
          <h2>{summary?.monthLabel ?? '尚未设置'}</h2>
        </div>
        <div className="salary-summary-card__status">
          {isPersisting && <span className="salary-pill">同步中…</span>}
          {!isPersisting && summary && <span className="salary-pill salary-pill--success">已更新</span>}
        </div>
      </header>

      <div className="salary-summary-card__total">
        <p className="label">预计实发（净额）</p>
        <p className="value">{isLoading ? '计算中…' : total}</p>
      </div>

      <div className="salary-summary-card__breakdown">
        <div>
          <p className="label">底薪</p>
          <p className="value">{base}</p>
        </div>
        <div>
          <p className="label">全勤</p>
          <p className="value">{attendance}</p>
        </div>
        <div>
          <p className="label">加班</p>
          <p className="value">{overtime}</p>
        </div>
        <div>
          <p className="label">扣款</p>
          <p className="value">{deductions}</p>
        </div>
      </div>

      {summary && (
        <div className="salary-summary-card__notice">
          <div>
            <p className="label">病假影响</p>
            <p>
              病假 {summary.mcDays} 天 · {attendanceImpact?.reason ?? '已计入全勤奖'}
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
            查看详情
          </button>
        )}
      </footer>
    </section>
  )
}

export default SalarySummaryCard
