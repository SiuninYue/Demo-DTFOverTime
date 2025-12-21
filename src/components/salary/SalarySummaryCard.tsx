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
    <section className="relative overflow-hidden rounded-[1.5rem] bg-[#F3F6FC] p-5 shadow-sm transition-all text-left">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">工资概览</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {summary?.monthLabel ?? '尚未设置'}
          </h2>
        </div>
        <div>
          {isPersisting ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
              同步中…
            </span>
          ) : summary ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-600">
              已更新
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">预计实发（净额）</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
          {isLoading ? '计算中…' : total}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-500">底薪</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{base}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-500">全勤</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{attendance}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-500">加班</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{overtime}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-medium text-slate-500">扣款</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{deductions}</p>
        </div>
      </div>

      {summary && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50/50 p-3 text-sm text-slate-700">
          <div>
            <p className="font-medium text-slate-900">病假影响</p>
            <p className="mt-0.5 text-xs text-slate-500 opacity-90">
              病假 {summary.mcDays} 天 · {attendanceImpact?.reason ?? '已计入全勤奖'}
            </p>
          </div>
          <div className="text-right font-bold tabular-nums">
            {attendanceContext}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <p>{progressLabel}</p>
          <p>{countdown}</p>
        </div>
      </div>

      <footer className="mt-5 flex items-center justify-between border-t border-slate-200/60 pt-4">
        <p className="text-xs text-slate-400">{lastSyncedLabel}</p>
        {onViewDetails && (
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:shadow-sm hover:text-slate-900"
            onClick={onViewDetails}
            disabled={isLoading}
          >
            查看详情
          </button>
        )}
      </footer>
    </section>
  )
}

export default SalarySummaryCard
