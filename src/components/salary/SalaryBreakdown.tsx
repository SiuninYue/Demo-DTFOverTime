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
    { label: 'Base salary', value: summary?.result.baseSalary },
    { label: 'Attendance bonus', value: summary?.result.attendanceBonus, hint: attendanceHint },
    { label: 'Rest day pay', value: summary?.result.restDayPay },
    { label: 'Public holiday pay', value: summary?.result.publicHolidayPay },
    { label: 'Overtime pay', value: summary?.result.overtimePay },
    { label: 'Deductions', value: summary ? -Math.abs(summary.result.deductions) : undefined },
    { label: 'Total gross', value: summary?.result.totalGross, highlight: true },
    { label: 'Net pay', value: summary?.result.netPay, highlight: true },
  ]

  const visibleRows = variant === 'compact' ? rows.filter((row, index) => index < 4 || row.highlight) : rows

  return (
    <section className={`salary-breakdown salary-breakdown--${variant}`}>
      <header>
        <h3>Pay breakdown</h3>
        {summary && (
          <p className="text-muted">
            MC days: {summary.mcDays} · Logged: {summary.recordedDays}/{summary.totalWorkingDays || '—'}
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
