import type { FormEvent } from 'react'
import { WorkScheduleType } from '@/types/employee'

export interface WorkPreferencesValues {
  normalWorkHours: number
  defaultRestHours: number
  workScheduleType: WorkScheduleType
}

interface WorkPreferencesFormProps {
  values: WorkPreferencesValues
  isSaving?: boolean
  onChange: (updates: Partial<WorkPreferencesValues>) => void
  onSubmit: () => void
}

const scheduleOptions: Array<{ value: WorkScheduleType; label: string; description: string }> = [
  { value: WorkScheduleType.FIVE_DAY, label: '5-day work week', description: 'Mon–Fri' },
  {
    value: WorkScheduleType.FIVE_HALF_DAY,
    label: '5.5-day (alternate weekends)',
    description: 'Mon–Sat with alternating off days',
  },
  { value: WorkScheduleType.SIX_DAY, label: '6-day work week', description: 'Mon–Sat' },
  { value: WorkScheduleType.FOUR_DAY, label: '4-day compressed', description: 'Shift-based' },
  { value: WorkScheduleType.CUSTOM, label: 'Custom', description: 'Manual working-day input' },
]

function WorkPreferencesForm({ values, onChange, onSubmit, isSaving }: WorkPreferencesFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="settings-card">
      <header className="settings-card__header">
        <div>
          <p className="label">Working rules</p>
          <h3>Work preferences</h3>
        </div>
        <button type="button" className="ghost" onClick={onSubmit} disabled={isSaving}>
          Save
        </button>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span>Normal work hours per day</span>
          <input
            type="number"
            min={4}
            max={12}
            step={0.5}
            value={values.normalWorkHours}
            onChange={(event) => onChange({ normalWorkHours: Number(event.target.value) })}
            required
          />
          <small className="text-muted">Used as overtime threshold for MOM calculations.</small>
        </label>

        <label className="settings-field">
          <span>Default rest hours</span>
          <input
            type="number"
            min={0}
            max={5}
            step={0.25}
            value={values.defaultRestHours}
            onChange={(event) => onChange({ defaultRestHours: Number(event.target.value) })}
            required
          />
        </label>

        <label className="settings-field">
          <span>Work schedule type</span>
          <select
            value={values.workScheduleType}
            onChange={(event) =>
              onChange({ workScheduleType: event.target.value as WorkScheduleType })
            }
          >
            {scheduleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.description}
              </option>
            ))}
          </select>
        </label>

        <div className="settings-form__actions">
          <button type="submit" className="secondary" disabled={isSaving}>
            Save preferences
          </button>
        </div>
      </form>
    </section>
  )
}

export default WorkPreferencesForm
