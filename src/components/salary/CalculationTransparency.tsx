import type { SalaryOverview } from '@/hooks/useSalary'
import { formatCurrency } from '@/utils/formatting'

interface CalculationTransparencyProps {
  summary?: SalaryOverview
}

function CalculationTransparency({ summary }: CalculationTransparencyProps) {
  const details = summary?.result.calculationDetails

  if (!summary || !details) {
    return (
      <section className="salary-transparency">
        <h3>Calculation transparency</h3>
        <p className="text-muted">Import a schedule and add timecards to see the full formula trace.</p>
      </section>
    )
  }

  return (
    <section className="salary-transparency">
      <h3>Calculation transparency</h3>
      <div className="salary-transparency__grid">
        <article>
          <p className="label">Hourly rate</p>
          <p className="value">{formatCurrency(details.hourlyRate)}</p>
          <small className="text-muted">Base ÷ 190.67</small>
        </article>
        <article>
          <p className="label">Daily rate</p>
          <p className="value">{formatCurrency(details.dailyRate)}</p>
          <small className="text-muted">Dynamic working days ({details.monthlyWorkingDays})</small>
        </article>
        <article>
          <p className="label">MC days</p>
          <p className="value">{details.mcDays ?? 0}</p>
          {details.attendanceBonusImpact && (
            <small className="text-muted">{details.attendanceBonusImpact.reason}</small>
          )}
        </article>
        <article>
          <p className="label">Overtime hours</p>
          <p className="value">{details.totalOvertimeHours.toFixed(1)}h</p>
          <small className="text-muted">
            Work {details.overtimeBreakdown?.workDay.hours ?? 0}h · Rest {details.overtimeBreakdown?.restDay.hours ?? 0}h · PH {details.overtimeBreakdown?.publicHoliday.hours ?? 0}h
          </small>
        </article>
      </div>
      <p className="text-muted">
        This breakdown follows MOM&apos;s compliant formula. Daily rates adapt to the roster instead of dividing by 26,
        preventing underpayment in shorter months.
      </p>
    </section>
  )
}

export default CalculationTransparency
