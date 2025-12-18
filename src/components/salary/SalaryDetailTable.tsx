import type { DailyBreakdown } from '@/types/salary'
import { DayType } from '@/types/timecard'
import { formatCurrency } from '@/utils/formatting'

interface SalaryDetailTableProps {
  breakdown: DailyBreakdown[]
  isLoading?: boolean
}

const dayTypeLabels: Record<DayType, string> = {
  [DayType.NORMAL_WORK_DAY]: '工作日',
  [DayType.REST_DAY]: '休息日（法定）',
  [DayType.PUBLIC_HOLIDAY]: '公假',
  [DayType.ANNUAL_LEAVE]: '年假',
  [DayType.MEDICAL_LEAVE]: '病假',
  [DayType.OFF_DAY]: '补休/调休',
}

function SalaryDetailTable({ breakdown, isLoading }: SalaryDetailTableProps) {
  if (isLoading) {
    return <p className="text-muted">正在加载每日明细…</p>
  }

  if (!breakdown.length) {
    return <p className="text-muted">本月暂无打卡记录。</p>
  }

  return (
    <div className="salary-detail-table">
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>类型</th>
            <th>工时</th>
            <th>底薪</th>
            <th>加班</th>
            <th>合计</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{dayTypeLabels[entry.dayType] ?? entry.dayType}</td>
              <td>{entry.hoursWorked.toFixed(2)}</td>
              <td>{formatCurrency(entry.pay.basePay)}</td>
              <td>{formatCurrency(entry.pay.overtimePay)}</td>
              <td className="highlight">{formatCurrency(entry.pay.totalPay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SalaryDetailTable
