import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import SalarySummaryCard from '@/components/salary/SalarySummaryCard'
import SalaryBreakdown from '@/components/salary/SalaryBreakdown'
import OvertimeWarning from '@/components/salary/OvertimeWarning'
import SalaryDetailTable from '@/components/salary/SalaryDetailTable'
import CalculationTransparency from '@/components/salary/CalculationTransparency'
import { useSalary, DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useAuthStore } from '@/store/authStore'
import Loading from '@/components/common/Loading'

const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const isValidMonthKey = (value?: string | null): value is string =>
  typeof value === 'string' && /^(\d{4})-(0[1-9]|1[0-2])$/.test(value)

function SalaryPage() {
  const params = useParams<{ monthId?: string }>()
  const defaultMonth = getCurrentMonthKey()
  const hasInvalidParam = Boolean(params.monthId && !isValidMonthKey(params.monthId))
  const month = isValidMonthKey(params.monthId) ? params.monthId : defaultMonth
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const { summary, isLoading, isPersisting, error, exportCsv, exportPdf, refresh } = useSalary({
    employeeId,
    month,
  })

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="salary-page">
      <header className="salary-page__header">
        <div>
          <p className="text-muted">Monthly summary</p>
          <h1>{summary?.monthLabel ?? 'Salary overview'}</h1>
        </div>
        <div className="salary-page__actions">
          <button type="button" className="ghost" onClick={exportCsv} disabled={!summary}>
            Export CSV
          </button>
          <button type="button" className="secondary" onClick={exportPdf} disabled={!summary}>
            Export PDF
          </button>
        </div>
      </header>

      {hasInvalidParam && (
        <p className="upload-error">Invalid month in URL. Showing the latest month instead.</p>
      )}
      {error && <p className="upload-error">Error: {error}</p>}
      {isLoading && <Loading label="Calculating salary" description="Applying MOM compliance rules" />}

      <SalarySummaryCard summary={summary} isLoading={isLoading} isPersisting={isPersisting} />

      <div className="salary-layout">
        <SalaryBreakdown summary={summary} isLoading={isLoading} />
        <OvertimeWarning summary={summary} />
        <CalculationTransparency summary={summary} />
      </div>

      <section className="salary-detail-section">
        <div className="salary-detail-section__header">
          <h3>Daily breakdown</h3>
          <span className="text-muted">{summary?.result.breakdown.length ?? 0} entries</span>
        </div>
        <SalaryDetailTable breakdown={summary?.result.breakdown ?? []} isLoading={isLoading} />
      </section>
    </section>
  )
}

export default SalaryPage
