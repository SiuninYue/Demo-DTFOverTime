import { CalculationMode } from '@/types/employee'

interface PartIVBadgeProps {
  isApplicable: boolean
  threshold: number
  baseSalary: number
  isWorkman: boolean
  calculationMode: CalculationMode
  layout?: 'inline' | 'stacked'
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('zh-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(
    Math.max(0, value),
  )

const getModeLabel = (mode: CalculationMode): string =>
  mode === CalculationMode.FULL_COMPLIANCE ? '完整合规模式' : '基础记录模式'

function PartIVBadge({
  isApplicable,
  threshold,
  baseSalary,
  isWorkman,
  calculationMode,
  layout = 'inline',
}: PartIVBadgeProps) {
  const status = isApplicable ? 'applicable' : 'not-applicable'
  const employmentLabel = isWorkman ? '工人' : '非工人'

  return (
    <div className={`part-iv-badge part-iv-badge--${status} part-iv-badge--${layout}`}>
      <div className="part-iv-badge__icon" aria-hidden="true">
        {isApplicable ? '✓' : '⚠️'}
      </div>
      <div>
        <p className="part-iv-badge__title">
          {isApplicable ? '适用 MOM 第四部分' : '不适用 MOM 第四部分'}
        </p>
        <p className="part-iv-badge__meta">
          {employmentLabel}月薪 {formatCurrency(baseSalary)} · 门槛 {formatCurrency(threshold)}
        </p>
        <p className="part-iv-badge__mode">{getModeLabel(calculationMode)}</p>
      </div>
    </div>
  )
}

export default PartIVBadge
