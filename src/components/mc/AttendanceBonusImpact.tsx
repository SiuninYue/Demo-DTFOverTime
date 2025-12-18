import type { SalaryOverview } from '@/hooks/useSalary'
import { formatCurrency } from '@/utils/formatting'

interface AttendanceBonusImpactProps {
  summary?: SalaryOverview
  isLoading?: boolean
}

const formatPercent = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—'
  }
  return `${Math.round(value * 100)}%`
}

function AttendanceBonusImpact({ summary, isLoading }: AttendanceBonusImpactProps) {
  const impact = summary?.result.calculationDetails.attendanceBonusImpact
  const mcDays = summary?.mcDays ?? 0
  const fullAmount = impact?.fullAmount ?? summary?.result.attendanceBonus ?? 0
  const actualAmount = impact?.actualAmount ?? summary?.result.attendanceBonus ?? 0

  return (
    <section className="mc-card">
      <header className="mc-card__header">
        <div>
          <p className="label">全勤奖影响</p>
          <h3>{isLoading ? '计算中…' : formatCurrency(actualAmount)}</h3>
        </div>
        <span className="badge">{formatPercent(impact?.rate)}</span>
      </header>
      <p className="text-muted">
        {impact?.reason ?? '病假天数会影响每月全勤奖的发放比例。'}
      </p>
      <ul className="mc-meta">
        <li>
          <span>应得金额</span>
          <strong>{formatCurrency(fullAmount)}</strong>
        </li>
        <li>
          <span>已记录病假天数</span>
          <strong>{mcDays}</strong>
        </li>
      </ul>
    </section>
  )
}

export default AttendanceBonusImpact
