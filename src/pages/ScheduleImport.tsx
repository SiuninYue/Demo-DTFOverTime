import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useTimecardStore } from '@/store/timecardStore'
import { getMonthlyRecords } from '@/services/supabase/timeRecords'

const getCurrentMonthId = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const shiftMonth = (month: string, delta: number) => {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1 + delta
  const date = new Date(year, monthIndex, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
  const setSchedule = useScheduleStore((state) => state.setSchedule)
  const { isOnline } = useNetworkStatus()
  const { showToast } = useToast()
  const timeRecords = useTimecardStore((state) => state.recordsByMonth[month] ?? {})
  const loadMonthRecords = useTimecardStore((state) => state.loadMonth)
  const timecardStatus = useTimecardStore((state) => state.statusByMonth[month] ?? 'idle')

  useEffect(() => {
    if (!isOnline) return
    if (timecardStatus === 'idle') {
      loadMonthRecords(month, () => getMonthlyRecords(employeeId, month)).catch(() => { })
    }
  }, [employeeId, isOnline, loadMonthRecords, month, timecardStatus])

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
      showToast({
        title: '已保存排班',
        description: `${month} 排班已就绪。`,
        variant: 'success',
      })
      navigate(`/calendar/${month}`)
    } catch (error) {
      setManualStatus('error')
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
          <div className="month-switcher">
            <button
              type="button"
              className="ghost month-switcher__button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              id="month-input"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 dark:border-neutral-700"
            />
            <button
              type="button"
              className="ghost month-switcher__button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {!isOnline && (
        <p className="offline-banner mb-4">
          当前离线，恢复网络连接后才能编辑与保存。
        </p>
      )}

      <ManualScheduleForm
        month={month}
        initialData={schedule?.scheduleData}
        isSaving={manualStatus === 'saving'}
        onSubmit={handleScheduleSubmit}
        disabled={!isOnline}
        disabledReason={!isOnline ? '请连接网络后再编辑与保存排班。' : null}
        timeRecords={timeRecords}
      />
    </section>
  )
}

export default ScheduleImportPage
