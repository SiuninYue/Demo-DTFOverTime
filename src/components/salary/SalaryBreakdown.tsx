import type { SalaryOverview } from '@/hooks/useSalary'
import { formatCurrency } from '@/utils/formatting'

interface SalaryBreakdownProps {
  summary?: SalaryOverview
  isLoading?: boolean
  variant?: 'full' | 'compact'
}

const formatAmount = (value?: number): string => formatCurrency(value ?? null)

function SalaryBreakdown({ summary, isLoading, variant = 'full' }: SalaryBreakdownProps) {
  const attendanceHint = summary?.result.calculationDetails.attendanceBonusImpact?.reason
  const rows = [
    { label: '底薪', value: summary?.result.baseSalary },
    { label: '全勤奖', value: summary?.result.attendanceBonus, hint: attendanceHint },
    { label: '休息日工资', value: summary?.result.restDayPay },
    { label: '公假工资', value: summary?.result.publicHolidayPay },
    { label: '加班工资', value: summary?.result.overtimePay },
    { label: '扣款', value: summary ? -Math.abs(summary.result.deductions) : undefined },
    { label: '应发合计', value: summary?.result.totalGross, highlight: true },
    { label: '实发净额', value: summary?.result.netPay, highlight: true },
  ]

  const visibleRows = variant === 'compact' ? rows.filter((row, index) => index < 4 || row.highlight) : rows

  return (
    <section className={`salary-breakdown salary-breakdown--${variant}`}>
      <header>
        <h3>工资拆分</h3>
        {summary && (
          <p className="text-muted">
            病假：{summary.mcDays} 天 · 已记录：{summary.recordedDays}/{summary.totalWorkingDays || '—'} 天
          </p>
        )}
      </header>
      <ul>
        {visibleRows.map((row) => (
          <li key={row.label} className={row.highlight ? 'highlight' : undefined}>
            <div>
              <p>{row.label}</p>
              {row.hint && <small className="text-muted">{row.hint}</small>}
            </div>
            <strong>{isLoading ? '…' : formatAmount(row.value)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SalaryBreakdown
