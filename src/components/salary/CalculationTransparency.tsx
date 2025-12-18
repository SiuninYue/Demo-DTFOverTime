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
        <h3>计算说明</h3>
        <p className="text-muted">导入排班并添加打卡记录后，可查看完整的计算明细。</p>
      </section>
    )
  }

  return (
    <section className="salary-transparency">
      <h3>计算说明</h3>
      <div className="salary-transparency__grid">
        <article>
          <p className="label">时薪</p>
          <p className="value">{formatCurrency(details.hourlyRate)}</p>
          <small className="text-muted">底薪 ÷ 190.67</small>
        </article>
        <article>
          <p className="label">日薪</p>
          <p className="value">{formatCurrency(details.dailyRate)}</p>
          <small className="text-muted">按动态工作日数计算（{details.monthlyWorkingDays}）</small>
        </article>
        <article>
          <p className="label">病假天数</p>
          <p className="value">{details.mcDays ?? 0}</p>
          {details.attendanceBonusImpact && (
            <small className="text-muted">{details.attendanceBonusImpact.reason}</small>
          )}
        </article>
        <article>
          <p className="label">加班时数</p>
          <p className="value">{details.totalOvertimeHours.toFixed(1)}h</p>
          <small className="text-muted">
            工作日 {details.overtimeBreakdown?.workDay.hours ?? 0}h · 休息日 {details.overtimeBreakdown?.restDay.hours ?? 0}h · 公假 {details.overtimeBreakdown?.publicHoliday.hours ?? 0}h
          </small>
        </article>
      </div>
      <p className="text-muted">
        本明细遵循 MOM 合规公式。日薪按排班动态工作日数计算，而非固定除以 26，可避免短月份低估工资。
      </p>
    </section>
  )
}

export default CalculationTransparency
