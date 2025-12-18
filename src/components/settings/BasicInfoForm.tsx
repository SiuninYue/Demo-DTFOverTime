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
  { value: true, label: '工人（门槛 $4,500）' },
  { value: false, label: '非工人（门槛 $2,600）' },
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
          <p className="label">个人资料</p>
          <h3>基本信息</h3>
        </div>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span>姓名</span>
          <input
            type="text"
            value={values.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="例如：张三"
            required
          />
        </label>

        <label className="settings-field">
          <span>工作邮箱</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="name@dtf.com.sg"
            required
          />
        </label>

        <label className="settings-field">
          <span>员工编号</span>
          <input
            type="text"
            value={values.employeeId ?? ''}
            onChange={(event) => onChange({ employeeId: event.target.value || undefined })}
            placeholder="DTF-001"
          />
        </label>

        <label className="settings-field">
          <span>职位</span>
          <input
            type="text"
            value={values.position ?? ''}
            onChange={(event) => onChange({ position: event.target.value || undefined })}
            placeholder="例如：厨师、服务员"
          />
        </label>

        <label className="settings-field">
          <span>门店代码</span>
          <input
            type="text"
            value={values.outletCode ?? ''}
            onChange={(event) => onChange({ outletCode: event.target.value || undefined })}
            placeholder="DTF-SG-01"
          />
        </label>

        <fieldset className="settings-field settings-field--inline">
          <legend>雇佣类型</legend>
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
            用于判断是否适用 MOM 第四部分及加班资格。
          </p>
        </fieldset>

        <div className="settings-form__actions">
          <button type="submit" className="secondary" disabled={isSaving}>
            保存基本信息
          </button>
        </div>
      </form>
    </section>
  )
}

export default BasicInfoForm
