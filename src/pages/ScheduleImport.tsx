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
      setStatusMessage('Schedule saved successfully.')
      showToast({
        title: 'Schedule saved',
        description: `${month} schedule is ready.`,
        variant: 'success',
      })
      navigate(`/calendar/${month}`)
    } catch (error) {
      setManualStatus('error')
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save schedule. Please retry.',
      )
      showToast({
        title: 'Save failed',
        description:
          error instanceof Error ? error.message : 'Unable to persist schedule. Please retry.',
        variant: 'error',
      })
      throw error
    }
  }

  return (
    <section className="schedule-import">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">Manual Schedule Entry</h1>
        <p className="text-muted mb-4">
          Enter or edit your schedule below. Use the "Copy" tool to quickly duplicate shifts.
        </p>
        <div className="form-control">
          <label htmlFor="month-input" className="text-sm font-medium mb-1">Target Month</label>
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
          You are offline. Editing and saving is disabled until connection is restored.
        </p>
      )}

      <ManualScheduleForm
        month={month}
        isSaving={manualStatus === 'saving'}
        onSubmit={handleScheduleSubmit}
        disabled={!isOnline}
        disabledReason={!isOnline ? 'Connect to the internet to edit and save schedule entries.' : null}
      />
    </section>
  )
}

export default ScheduleImportPage
