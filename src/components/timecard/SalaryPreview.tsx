import type { DailyPayResult } from '@/services/salary/calculator'
import { DayType } from '@/types/timecard'

interface SalaryPreviewProps {
  preview?: DailyPayResult
  dayType: DayType
  isSaving: boolean
}

const dayTypeLabels: Record<DayType, string> = {
  [DayType.NORMAL_WORK_DAY]: '正常工作',
  [DayType.REST_DAY]: '休息',
  [DayType.PUBLIC_HOLIDAY]: '公假',
  [DayType.ANNUAL_LEAVE]: '年假',
  [DayType.MEDICAL_LEAVE]: '病假',
  [DayType.OFF_DAY]: '补休/调休',
}

function SalaryPreview({ preview, dayType, isSaving }: SalaryPreviewProps) {
  if (!preview) {
    return (
      <section className="salary-preview">
        <p className="text-muted">请输入开始/结束时间，以查看符合 MOM 规则的工资预览。</p>
      </section>
    )
  }

  return (
    <section className="salary-preview">
      <header>
        <h3>工资预览</h3>
        <span className="text-muted">{dayTypeLabels[dayType]}</span>
      </header>
      <div className="salary-preview__grid">
        <div>
          <p className="label">工作时数</p>
          <p className="value">{preview.hoursWorked.toFixed(2)}h</p>
        </div>
        <div>
          <p className="label">基础工资</p>
          <p className="value">${preview.pay.basePay.toFixed(2)}</p>
        </div>
        <div>
          <p className="label">加班工资</p>
          <p className="value">${preview.pay.overtimePay.toFixed(2)}</p>
        </div>
        <div>
          <p className="label">合计</p>
          <p className="value value--highlight">${preview.pay.totalPay.toFixed(2)}</p>
        </div>
      </div>
      {isSaving && <p className="text-muted">保存中…</p>}
    </section>
  )
}

export default SalaryPreview
