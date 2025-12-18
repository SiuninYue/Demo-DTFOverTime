import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SalarySummaryCard from '@/components/salary/SalarySummaryCard'
import MCRecordList from '@/components/mc/MCRecordList'
import AddMCModal, { ConfirmDeleteDialog } from '@/components/mc/AddMCModal'
import AttendanceBonusImpact from '@/components/mc/AttendanceBonusImpact'
import YearlyMCQuota from '@/components/mc/YearlyMCQuota'
import { useSalary, DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import useMC, { type NewMcRecordInput } from '@/hooks/useMC'
import type { MCRecord } from '@/services/supabase/mcRecords'
import { useAuthStore } from '@/store/authStore'

const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function MCPage() {
  const navigate = useNavigate()
  const [isModalOpen, setModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MCRecord | null>(null)
  const month = getCurrentMonthKey()
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const salaryState = useSalary({ employeeId, month })
  const mcState = useMC({
    employeeId,
    month,
    onRecalculate: salaryState.refresh,
  })

  const defaultDate = new Date().toISOString().slice(0, 10)

  const handleAdd = async (input: NewMcRecordInput) => {
    await mcState.addRecord(input)
    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!pendingDelete) {
      return
    }
    await mcState.removeRecord(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <section className="mc-page">
      <header className="mc-page__header">
        <div>
          <p className="text-muted">病假证明</p>
          <h1>病假记录与全勤奖</h1>
        </div>
        <div className="mc-page__actions">
          <button
            type="button"
            className="ghost"
            onClick={() => {
              mcState.refresh().catch(() => {
                /* handled in hook state */
              })
            }}
            disabled={mcState.isLoading || mcState.isMutating}
          >
            刷新
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setModalOpen(true)}
            disabled={mcState.isMutating}
          >
            新增病假记录
          </button>
        </div>
      </header>

      {(mcState.error || salaryState.error) && (
        <p className="upload-error">
          ⚠️ {mcState.error ?? salaryState.error}
        </p>
      )}

      <div className="mc-page__grid">
        <div className="mc-page__main">
          <SalarySummaryCard
            summary={salaryState.summary}
            isLoading={salaryState.isLoading}
            isPersisting={salaryState.isPersisting}
            onViewDetails={() => navigate('/salary')}
          />
          <AttendanceBonusImpact summary={salaryState.summary} isLoading={salaryState.isLoading} />
          <MCRecordList
            records={mcState.records}
            isLoading={mcState.isLoading}
            onDelete={(record) => setPendingDelete(record)}
            disabled={mcState.isMutating}
          />
        </div>
        <aside className="mc-page__sidebar">
          <section className="mc-card">
            <header className="mc-card__header">
              <div>
                <p className="label">本月</p>
                <h3>病假 {mcState.stats.monthlyDays} 天</h3>
              </div>
            </header>
            <p className="text-muted">
              每次提交病假记录都会立即更新全勤奖计算，并同步到工资概览。
            </p>
          </section>
          <YearlyMCQuota
            usedDays={mcState.stats.yearlyDays}
            quota={mcState.stats.quota}
            isLoading={mcState.isYearlyLoading}
          />
        </aside>
      </div>

      <AddMCModal
        isOpen={isModalOpen}
        month={month}
        defaultDate={defaultDate}
        isSubmitting={mcState.isMutating}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />

      <ConfirmDeleteDialog
        isOpen={Boolean(pendingDelete)}
        isProcessing={mcState.isMutating}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}

export default MCPage
