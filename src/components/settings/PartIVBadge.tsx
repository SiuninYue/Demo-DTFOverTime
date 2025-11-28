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
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(
    Math.max(0, value),
  )

const getModeLabel = (mode: CalculationMode): string =>
  mode === CalculationMode.FULL_COMPLIANCE ? 'Full compliance mode' : 'Basic tracking mode'

function PartIVBadge({
  isApplicable,
  threshold,
  baseSalary,
  isWorkman,
  calculationMode,
  layout = 'inline',
}: PartIVBadgeProps) {
  const status = isApplicable ? 'applicable' : 'not-applicable'
  const employmentLabel = isWorkman ? 'Workman' : 'Non-workman'

  return (
    <div className={`part-iv-badge part-iv-badge--${status} part-iv-badge--${layout}`}>
      <div className="part-iv-badge__icon" aria-hidden="true">
        {isApplicable ? '✓' : '⚠️'}
      </div>
      <div>
        <p className="part-iv-badge__title">
          {isApplicable ? 'Covered under MOM Part IV' : 'Not covered by Part IV'}
        </p>
        <p className="part-iv-badge__meta">
          {employmentLabel} salary {formatCurrency(baseSalary)} / mo · Threshold {formatCurrency(threshold)}
        </p>
        <p className="part-iv-badge__mode">{getModeLabel(calculationMode)}</p>
      </div>
    </div>
  )
}

export default PartIVBadge
