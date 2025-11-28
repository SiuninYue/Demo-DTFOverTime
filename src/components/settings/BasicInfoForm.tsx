import type { FormEvent } from 'react'

export interface BasicInfoValues {
  name: string
  email: string
  employeeId?: string
  position?: string
  outletCode?: string
  isWorkman: boolean
}

interface BasicInfoFormProps {
  values: BasicInfoValues
  isSaving?: boolean
  onChange: (updates: Partial<BasicInfoValues>) => void
  onSubmit: () => void
}

const employmentOptions = [
  { value: true, label: 'Workman (threshold $4,500)' },
  { value: false, label: 'Non-workman (threshold $2,600)' },
]

function BasicInfoForm({ values, onChange, onSubmit, isSaving }: BasicInfoFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="settings-card">
      <header className="settings-card__header">
        <div>
          <p className="label">Profile</p>
          <h3>Basic information</h3>
        </div>
        <button type="button" className="ghost" onClick={onSubmit} disabled={isSaving}>
          Save
        </button>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span>Full name</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="e.g., KELLY TEIN ROU YI"
            required
          />
        </label>

        <label className="settings-field">
          <span>Work email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="name@dtf.com.sg"
            required
          />
        </label>

        <label className="settings-field">
          <span>Employee ID</span>
          <input
            type="text"
            value={values.employeeId ?? ''}
            onChange={(event) => onChange({ employeeId: event.target.value || undefined })}
            placeholder="DTF-001"
          />
        </label>

        <label className="settings-field">
          <span>Position</span>
          <input
            type="text"
            value={values.position ?? ''}
            onChange={(event) => onChange({ position: event.target.value || undefined })}
            placeholder="Chef, Server, etc."
          />
        </label>

        <label className="settings-field">
          <span>Outlet code</span>
          <input
            type="text"
            value={values.outletCode ?? ''}
            onChange={(event) => onChange({ outletCode: event.target.value || undefined })}
            placeholder="DTF-SG-01"
          />
        </label>

        <fieldset className="settings-field settings-field--inline">
          <legend>Employment type</legend>
          <div className="settings-radio-group">
            {employmentOptions.map((option) => (
              <label key={String(option.value)} className="radio-pill">
                <input
                  type="radio"
                  name="employmentType"
                  value={String(option.value)}
                  checked={values.isWorkman === option.value}
                  onChange={() => onChange({ isWorkman: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <p className="text-muted">
            Used to determine MOM Part IV coverage and overtime eligibility.
          </p>
        </fieldset>

        <div className="settings-form__actions">
          <button type="submit" className="secondary" disabled={isSaving}>
            Save basic info
          </button>
        </div>
      </form>
    </section>
  )
}

export default BasicInfoForm
