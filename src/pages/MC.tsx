import { useState } from 'react'
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
          <h1>病假记录</h1>
        </div>
        <button
          type="button"
          className="mc-add-btn"
          onClick={() => setModalOpen(true)}
          disabled={mcState.isMutating}
        >
          + 新增病假
        </button>
      </header>

      {(mcState.error || salaryState.error) && (
        <p className="upload-error">
          ⚠️ {mcState.error ?? salaryState.error}
        </p>
      )}

      {/* 顶部统计卡片 - 移动端优先显示 */}
      <div className="mc-stats-row">
        <div className="mc-stat-card mc-stat-card--primary">
          <div className="mc-stat-card__icon">📋</div>
          <div className="mc-stat-card__content">
            <span className="mc-stat-card__value">{mcState.stats.monthlyDays}</span>
            <span className="mc-stat-card__label">本月病假天数</span>
          </div>
        </div>
        <div className="mc-stat-card">
          <div className="mc-stat-card__icon">📅</div>
          <div className="mc-stat-card__content">
            <span className="mc-stat-card__value">{mcState.stats.yearlyDays}/{mcState.stats.quota}</span>
            <span className="mc-stat-card__label">年度额度使用</span>
          </div>
        </div>
        <div className="mc-stat-card">
          <div className="mc-stat-card__icon">💰</div>
          <div className="mc-stat-card__content">
            <span className="mc-stat-card__value">
              {salaryState.summary?.result.attendanceBonus
                ? `$${salaryState.summary.result.attendanceBonus.toFixed(0)}`
                : '--'}
            </span>
            <span className="mc-stat-card__label">当前全勤奖</span>
          </div>
        </div>
      </div>

      <div className="mc-page__grid">
        <div className="mc-page__main">
          <MCRecordList
            records={mcState.records}
            isLoading={mcState.isLoading}
            onDelete={(record) => setPendingDelete(record)}
            disabled={mcState.isMutating}
          />
        </div>
        <aside className="mc-page__sidebar">
          <AttendanceBonusImpact summary={salaryState.summary} isLoading={salaryState.isLoading} />
          <YearlyMCQuota
            usedDays={mcState.stats.yearlyDays}
            quota={mcState.stats.quota}
            isLoading={mcState.isYearlyLoading}
          />
          <div className="mc-tip-card">
            <p>每次提交病假记录都会立即更新全勤奖计算，并同步到工资概览。</p>
            <button
              type="button"
              className="ghost mc-refresh-btn"
              onClick={() => {
                mcState.refresh().catch(() => {
                  /* handled in hook state */
                })
              }}
              disabled={mcState.isLoading || mcState.isMutating}
            >
              刷新数据
            </button>
          </div>
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
