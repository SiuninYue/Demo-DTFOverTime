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
    <section className="bg-transparent space-y-2">
      <header className="px-4 pb-2">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">薪酬设置</h3>
        <p className="text-xs text-neutral-400 mt-1">设置您的基础薪资与发薪日</p>
      </header>

      <div className="px-4 mb-4">
        <PartIVBadge
          isApplicable={evaluation.isApplicable}
          threshold={evaluation.threshold}
          baseSalary={values.baseSalary}
          isWorkman={isWorkman}
          calculationMode={evaluation.calculationMode}
          layout="stacked"
        />
      </div>

      {showRestrictionBanner && (
        <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-xl border border-amber-200 dark:border-amber-800/50">
          <strong>不适用 MOM 第四部分。</strong> 加班倍率与休息日加班规则将被停用，系统仅记录基础工时（基础记录模式）。
        </div>
      )}

      <form className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-neutral-200/50 dark:border-neutral-800" onSubmit={handleSubmit}>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Base Salary */}
          <div className="flex items-center justify-between p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">基本月薪 (SGD)</span>
            <input
              type="number"
              min={0} step={10}
              value={values.baseSalary}
              onChange={(event) => onChange({ baseSalary: Number(event.target.value) })}
              className="text-right bg-transparent outline-none w-32 font-medium text-blue-600 dark:text-blue-400"
              required
            />
          </div>

          {/* Attendance Bonus */}
          <div className="flex items-center justify-between p-4">
            <span className="text-base font-medium text-neutral-900 dark:text-neutral-100">全勤奖</span>
            <input
              type="number"
              min={0} step={10}
              value={values.attendanceBonus}
              onChange={(event) => onChange({ attendanceBonus: Number(event.target.value) })}
              className="text-right bg-transparent outline-none w-32 font-medium text-blue-600 dark:text-blue-400"
            />
          </div>

          {/* Pay Day */}
          <div className="flex items-center justify-between p-4">
            <div>
              <span className="text-base font-medium text-neutral-900 dark:text-neutral-100 block">发薪日</span>
              <span className="text-xs text-neutral-400">每月</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">每月</span>
              <input
                type="number"
                min={1} max={31}
                value={values.payDay}
                onChange={(event) => onChange({ payDay: Number(event.target.value) })}
                className="text-right bg-transparent outline-none w-12 font-medium text-blue-600 dark:text-blue-400"
                required
              />
              <span className="text-neutral-400">号</span>
            </div>
          </div>
        </div>
        {/* Implicit save via onChange or explicit save button */}
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

export default SalaryInfoForm
