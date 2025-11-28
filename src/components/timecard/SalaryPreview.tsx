import type { DailyPayResult } from '@/types/salary'
import { DayType } from '@/types/timecard'

interface SalaryPreviewProps {
  preview?: DailyPayResult
  dayType: DayType
  isSaving: boolean
}

const dayTypeLabels: Record<DayType, string> = {
  [DayType.NORMAL_WORK_DAY]: 'Normal Work Day',
  [DayType.REST_DAY]: 'Rest Day',
  [DayType.PUBLIC_HOLIDAY]: 'Public Holiday',
  [DayType.ANNUAL_LEAVE]: 'Annual Leave',
  [DayType.MEDICAL_LEAVE]: 'Medical Leave',
  [DayType.OFF_DAY]: 'Off Day',
}

function SalaryPreview({ preview, dayType, isSaving }: SalaryPreviewProps) {
  if (!preview) {
    return (
      <section className="salary-preview">
        <p className="text-muted">Enter start/end times to see MOM-compliant pay preview.</p>
      </section>
    )
  }

  return (
    <section className="salary-preview">
      <header>
        <h3>Salary Preview</h3>
        <span className="text-muted">{dayTypeLabels[dayType]}</span>
      </header>
      <div className="salary-preview__grid">
        <div>
          <p className="label">Hours Worked</p>
          <p className="value">{preview.hoursWorked.toFixed(2)}h</p>
        </div>
        <div>
          <p className="label">Base Pay</p>
          <p className="value">${preview.pay.basePay.toFixed(2)}</p>
        </div>
        <div>
          <p className="label">Overtime Pay</p>
          <p className="value">${preview.pay.overtimePay.toFixed(2)}</p>
        </div>
        <div>
          <p className="label">Total</p>
          <p className="value value--highlight">${preview.pay.totalPay.toFixed(2)}</p>
        </div>
      </div>
      {isSaving && <p className="text-muted">Saving…</p>}
    </section>
  )
}

export default SalaryPreview
