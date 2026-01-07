import type { FormEvent } from 'react'
import { WorkScheduleType } from '@/types/employee'

export interface WorkPreferencesValues {
  normalWorkHours: number
  defaultRestHours: number
  defaultStartTime?: string
  defaultEndTime?: string
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
  { value: WorkScheduleType.CUSTOM, label: '自定义', description: '手动输入工作' },
]

function WorkPreferencesForm({ values, onChange, onSubmit, isSaving }: WorkPreferencesFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="bg-transparent space-y-2">
      <header className="px-4 pb-2">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">工作偏好</h3>
        <p className="text-xs text-neutral-400 mt-1">设置您的常规工作时间和类型</p>
      </header>

      <form className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-neutral-200/50 dark:border-neutral-800" onSubmit={handleSubmit}>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">

          {/* Normal Work Hours */}
          <div className="flex items-center justify-between p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">每日正常工作时长</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={4} max={12} step={0.5}
                value={values.normalWorkHours}
                onChange={(event) => onChange({ normalWorkHours: Number(event.target.value) })}
                className="text-right bg-transparent outline-none w-16 font-medium text-blue-600 dark:text-blue-400"
                required
              />
              <span className="text-neutral-400 text-sm">小时</span>
            </div>
          </div>

          {/* Default Rest Hours */}
          <div className="flex items-center justify-between p-4">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">默认休息时长</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={5} step={0.25}
                value={values.defaultRestHours}
                onChange={(event) => onChange({ defaultRestHours: Number(event.target.value) })}
                className="text-right bg-transparent outline-none w-16 font-medium text-blue-600 dark:text-blue-400"
                required
              />
              <span className="text-neutral-400 text-sm">小时</span>
            </div>
          </div>

          {/* Start Time */}
          <div className="flex items-center justify-between p-4">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">默认上班时间</span>
            <input
              type="time"
              value={values.defaultStartTime ?? ''}
              onChange={(event) => onChange({ defaultStartTime: event.target.value })}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* End Time */}
          <div className="flex items-center justify-between p-4">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">默认下班时间</span>
            <input
              type="time"
              value={values.defaultEndTime ?? ''}
              onChange={(event) => onChange({ defaultEndTime: event.target.value })}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Schedule Type */}
          <div className="flex items-center justify-between p-4">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">工作制类型</span>
            <select
              value={values.workScheduleType}
              onChange={(event) => onChange({ workScheduleType: event.target.value as WorkScheduleType })}
              className="bg-transparent text-right outline-none text-neutral-600 dark:text-neutral-400 font-medium dir-rtl"
              style={{ direction: 'rtl' }}
            >
              {scheduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Autosave Indicator / Save Button usually implicit in iOS Settings, but here we might need manual save? The props have isSaving. */}
        {/* If auto-save pattern is used, we don't need a button. Original had "Save". Let's update to auto-save style or keep button but cleaner.
            Since typical iOS settings are auto-save or "Back to save", I will keep a subtle button or rely on parent handling.
            Prop `onChange` updates state. `onSubmit` triggers save.
            I'll add a row at bottom for action? Or just leave it as is.
            Original had a ghostly save button.
        */}
      </form>

      <div className="px-4">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full py-3 mt-2 text-blue-600 dark:text-blue-400 font-semibold text-sm active:opacity-50 transition-opacity"
        >
          {isSaving ? '保存中...' : '保存更改'}
        </button>
      </div>
    </section>
  )
}

export default WorkPreferencesForm
