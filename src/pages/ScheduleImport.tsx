import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ManualScheduleForm from '@/components/schedule/ManualScheduleForm'
import { DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useAuthStore } from '@/store/authStore'
import type { ScheduleData } from '@/types/schedule'
import { upsertSchedule } from '@/services/supabase/database'
import { useScheduleStore } from '@/store/scheduleStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useToast } from '@/components/common/Toast'
import { useSchedule } from '@/hooks/useSchedule'

const getCurrentMonthId = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function ScheduleImportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const [month, setMonth] = useState(searchParams.get('month') ?? getCurrentMonthId())

  // Fetch existing schedule
  const { schedule } = useSchedule({
    employeeId,
    month,
    autoFetch: true,
  })

  const [manualStatus, setManualStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const setSchedule = useScheduleStore((state) => state.setSchedule)
  const { isOnline } = useNetworkStatus()
  const { showToast } = useToast()

  const handleScheduleSubmit = async (data: ScheduleData) => {
    setManualStatus('saving')
    try {
      const saved = await upsertSchedule({
        employeeId,
        month,
        scheduleData: data,
        imageUrl: null,
        imageFileName: null,
        imageSize: null,
      })
      setSchedule(saved)
      setManualStatus('success')
      setStatusMessage('排班已保存。')
      showToast({
        title: '已保存排班',
        description: `${month} 排班已就绪。`,
        variant: 'success',
      })
      navigate(`/calendar/${month}`)
    } catch (error) {
      setManualStatus('error')
      setStatusMessage(
        error instanceof Error ? error.message : '保存排班失败，请重试。',
      )
      showToast({
        title: '保存失败',
        description:
          error instanceof Error ? error.message : '无法保存排班，请重试。',
        variant: 'error',
      })
      throw error
    }
  }

  return (
    <section className="schedule-import">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">手动录入排班</h1>
        <p className="text-muted mb-4">
          在下方录入或编辑排班，可使用“复制”快速复用班次。
        </p>
        <div className="form-control">
          <label htmlFor="month-input" className="text-sm font-medium mb-1">目标月份</label>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
      </header>

      {!isOnline && (
        <p className="offline-banner mb-4">
          当前离线，恢复网络连接后才能编辑与保存。
        </p>
      )}

      <ManualScheduleForm
        month={month}
        isSaving={manualStatus === 'saving'}
        onSubmit={handleScheduleSubmit}
        disabled={!isOnline}
        disabledReason={!isOnline ? '请连接网络后再编辑与保存排班。' : null}
      />
    </section>
  )
}

export default ScheduleImportPage
