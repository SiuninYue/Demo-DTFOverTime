import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PullToRefresh from '@/components/common/PullToRefresh'
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

const getPreviousMonthKey = (current: string) => {
  const [yearStr, monthStr] = current.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1 - 1, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getNextMonthKey = (current: string) => {
  const [yearStr, monthStr] = current.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + 1, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function SalaryPage() {
  const params = useParams<{ monthId?: string }>()
  const navigate = useNavigate()
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

  const handleRefresh = async () => {
    await refresh()
  }

  const handlePrevMonth = () => {
    const prev = getPreviousMonthKey(month)
    navigate(`/salary/${prev}`)
  }

  const handleNextMonth = () => {
    const next = getNextMonthKey(month)
    navigate(`/salary/${next}`)
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <section className="salary-page">
        <header className="salary-page__header">
          <div>
            <p className="text-muted">月度汇总</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1>{summary?.monthLabel ?? '工资概览'}</h1>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                disabled={month === getCurrentMonthKey()}
              >
                <ChevronRight className={`w-5 h-5 ${month === getCurrentMonthKey() ? 'opacity-30' : ''}`} />
              </button>
            </div>
          </div>
          <div className="salary-page__actions">
            <button type="button" className="salary-export-btn" onClick={exportCsv} disabled={!summary}>
              <span className="salary-export-btn__icon">📊</span>
              CSV
            </button>
            <button type="button" className="salary-export-btn" onClick={exportPdf} disabled={!summary}>
              <span className="salary-export-btn__icon">📄</span>
              PDF
            </button>
          </div>
        </header>

        {hasInvalidParam && (
          <p className="upload-error">URL 中的月份无效，已显示最新月份。</p>
        )}
        {error && <p className="upload-error">错误：{error}</p>}
        {isLoading && <Loading label="正在计算工资" description="正在应用 MOM 合规规则" />}

        <SalarySummaryCard summary={summary} isLoading={isLoading} isPersisting={isPersisting} showShadow={true} />

        <div className="salary-layout">
          <div className="salary-layout__main">
            <SalaryBreakdown summary={summary} isLoading={isLoading} />
          </div>
          <div className="salary-layout__side">
            <OvertimeWarning summary={summary} />
            <CalculationTransparency summary={summary} />
          </div>
        </div>

        <section className="salary-detail-section">
          <div className="salary-detail-section__header">
            <div>
              <h3>每日明细</h3>
              <span className="text-muted">{summary?.result.breakdown.length ?? 0} 条打卡记录</span>
            </div>
          </div>
          <SalaryDetailTable breakdown={summary?.result.breakdown ?? []} isLoading={isLoading} />
        </section>
      </section>
    </PullToRefresh>
  )
}

export default SalaryPage
