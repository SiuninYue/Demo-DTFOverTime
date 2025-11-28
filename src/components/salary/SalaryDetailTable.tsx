import type { DailyBreakdown } from '@/types/salary'
import { DayType } from '@/types/timecard'
import { formatCurrency } from '@/utils/formatting'

interface SalaryDetailTableProps {
  breakdown: DailyBreakdown[]
  isLoading?: boolean
}

const dayTypeLabels: Record<DayType, string> = {
  [DayType.NORMAL_WORK_DAY]: 'Work day',
  [DayType.REST_DAY]: 'Rest day (statutory)',
  [DayType.PUBLIC_HOLIDAY]: 'Public holiday',
  [DayType.ANNUAL_LEAVE]: 'Annual leave',
  [DayType.MEDICAL_LEAVE]: 'Medical leave',
  [DayType.OFF_DAY]: 'Off day',
}

function SalaryDetailTable({ breakdown, isLoading }: SalaryDetailTableProps) {
  if (isLoading) {
    return <p className="text-muted">Loading daily breakdown…</p>
  }

  if (!breakdown.length) {
    return <p className="text-muted">No timecard entries found for this month.</p>
  }

  return (
    <div className="salary-detail-table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Hours</th>
            <th>Base</th>
            <th>OT</th>
            <th>Total</th>
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
