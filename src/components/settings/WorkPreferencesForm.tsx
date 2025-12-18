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
  { value: WorkScheduleType.FIVE_DAY, label: '五天工作制', description: '周一至周五' },
  {
    value: WorkScheduleType.FIVE_HALF_DAY,
    label: '五天半（轮休）',
    description: '周一至周六，轮流休息',
  },
  { value: WorkScheduleType.SIX_DAY, label: '六天工作制', description: '周一至周六' },
  { value: WorkScheduleType.FOUR_DAY, label: '四天压缩工时', description: '按班次' },
  { value: WorkScheduleType.CUSTOM, label: '自定义', description: '手动输入工作日' },
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
          <p className="label">工作规则</p>
          <h3>工作偏好</h3>
        </div>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span>每日正常工作时长</span>
          <input
            type="number"
            min={4}
            max={12}
            step={0.5}
            value={values.normalWorkHours}
            onChange={(event) => onChange({ normalWorkHours: Number(event.target.value) })}
            required
          />
          <small className="text-muted">用于 MOM 计算中的加班门槛。</small>
        </label>

        <label className="settings-field">
          <span>默认休息时长</span>
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

        <div className="flex gap-4">
          <label className="settings-field flex-1">
            <span>默认开始时间（上班）</span>
            <input
              type="time"
              value={values.defaultStartTime ?? ''}
              onChange={(event) => onChange({ defaultStartTime: event.target.value })}
            />
          </label>
          <label className="settings-field flex-1">
            <span>默认结束时间（下班）</span>
            <input
              type="time"
              value={values.defaultEndTime ?? ''}
              onChange={(event) => onChange({ defaultEndTime: event.target.value })}
            />
          </label>
        </div>

        <label className="settings-field">
          <span>工作制类型</span>
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
            保存工作偏好
          </button>
        </div>
      </form>
    </section>
  )
}

export default WorkPreferencesForm
