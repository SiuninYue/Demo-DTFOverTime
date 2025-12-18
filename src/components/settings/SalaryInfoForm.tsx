import { useEffect, useMemo, type FormEvent } from 'react'
import PartIVBadge from '@/components/settings/PartIVBadge'
import { CalculationMode } from '@/types/employee'
import { evaluatePartIV } from '@/utils/partIV'

export interface SalaryInfoValues {
  baseSalary: number
  attendanceBonus: number
  payDay: number
  isPartIVApplicable: boolean
  calculationMode: CalculationMode
}

interface SalaryInfoFormProps {
  values: SalaryInfoValues
  isWorkman: boolean
  isSaving?: boolean
  onChange: (updates: Partial<SalaryInfoValues>) => void
  onSubmit: () => void
}

function SalaryInfoForm({ values, isWorkman, onChange, onSubmit, isSaving }: SalaryInfoFormProps) {
  const evaluation = useMemo(
    () =>
      evaluatePartIV({
        baseSalary: values.baseSalary,
        isWorkman,
      }),
    [values.baseSalary, isWorkman],
  )

  useEffect(() => {
    if (
      evaluation.isApplicable !== values.isPartIVApplicable ||
      evaluation.calculationMode !== values.calculationMode
    ) {
      onChange({
        isPartIVApplicable: evaluation.isApplicable,
        calculationMode: evaluation.calculationMode,
      })
    }
  }, [evaluation, onChange, values.calculationMode, values.isPartIVApplicable])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  const showRestrictionBanner = !evaluation.isApplicable

  return (
    <section className="settings-card">
      <header className="settings-card__header">
        <div>
          <p className="label">Compensation</p>
          <h3>Salary & pay day</h3>
        </div>
      </header>

      <PartIVBadge
        isApplicable={evaluation.isApplicable}
        threshold={evaluation.threshold}
        baseSalary={values.baseSalary}
        isWorkman={isWorkman}
        calculationMode={evaluation.calculationMode}
        layout="stacked"
      />

      {showRestrictionBanner && (
        <div className="settings-alert settings-alert--warning">
          <strong>Part IV not applicable.</strong> Overtime multipliers and rest-day premium flows are
          disabled. The system will track base hours only (Basic tracking mode).
        </div>
      )}

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span>Base monthly salary (SGD)</span>
          <input
            type="number"
            min={0}
            step={10}
            value={values.baseSalary}
            onChange={(event) => onChange({ baseSalary: Number(event.target.value) })}
            required
          />
        </label>

        <label className="settings-field">
          <span>Attendance bonus</span>
          <input
            type="number"
            min={0}
            step={10}
            value={values.attendanceBonus}
            onChange={(event) => onChange({ attendanceBonus: Number(event.target.value) })}
          />
        </label>

        <label className="settings-field">
          <span>Pay day</span>
          <input
            type="number"
            min={1}
            max={31}
            value={values.payDay}
            onChange={(event) => onChange({ payDay: Number(event.target.value) })}
            required
          />
          <small className="text-muted">Used for payday countdown and exported payslips.</small>
        </label>

        <div className="settings-form__actions">
          <button type="submit" className="secondary" disabled={isSaving}>
            Save salary info
          </button>
        </div>
      </form>
    </section>
  )
}

export default SalaryInfoForm
