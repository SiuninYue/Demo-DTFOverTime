import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Import } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PullToRefresh from '@/components/common/PullToRefresh'
import MonthCalendar from '@/components/calendar/MonthCalendar'
import DayDetailModal from '@/components/calendar/DayDetailModal'
import { useSchedule } from '@/hooks/useSchedule'
import { DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import type { QuickAction } from '@/components/calendar/DayCell'
import Loading from '@/components/common/Loading'
import { useToast } from '@/components/common/Toast'
import { useTimecardStore } from '@/store/timecardStore'
import { useAuthStore } from '@/store/authStore'
import {
  createTimeRecord,
  getMonthlyRecords,
  updateTimeRecord,
} from '@/services/supabase/timeRecords'
import type { TimeRecord } from '@/types/timecard'

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

function CalendarPage() {
  const params = useParams<{ monthId?: string }>()
  const navigate = useNavigate()
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const monthId = params.monthId ?? getCurrentMonthId()
  const timeRecords = useTimecardStore((state) => state.recordsByMonth[monthId] ?? {})
  const loadMonthRecords = useTimecardStore((state) => state.loadMonth)
  const timecardStatus = useTimecardStore((state) => state.statusByMonth[monthId] ?? 'idle')
  const clipboardRef = useRef<string | null>(null)
  const clipboardRecordRef = useRef<TimeRecord | null>(null)

  useEffect(() => {
    if (!params.monthId) {
      navigate(`/calendar/${monthId}`, { replace: true })
    }
  }, [navigate, params.monthId, monthId])

  useEffect(() => {
    if (timecardStatus === 'idle') {
      loadMonthRecords(monthId, () => getMonthlyRecords(employeeId, monthId)).catch(() => { })
    }
  }, [employeeId, loadMonthRecords, monthId, timecardStatus])

  const { schedule, isLoading, error, isOffline, hasData, refresh } = useSchedule({
    employeeId,
    month: monthId,
  })

  const [detailDate, setDetailDate] = useState<string | null>(null)
  const [isDetailOpen, setDetailOpen] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (!hasData) {
      refresh()
    }
  }, [hasData, refresh])

  const selectedEntry = useMemo(() => {
    if (!detailDate || !schedule) return undefined
    return schedule.scheduleData[detailDate]
  }, [detailDate, schedule])

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const target = shiftMonth(monthId, direction === 'prev' ? -1 : 1)
    navigate(`/calendar/${target}`)
  }

  const handleSelectDate = (date: string) => {
    setDetailDate(date)
    setDetailOpen(true)
  }

  const openScheduleEditor = (date: string) => {
    const monthFromDate = date.slice(0, 7)
    navigate(`/schedule/import?month=${monthFromDate}`)
  }

  const handleQuickAction = (date: string, action: QuickAction) => {
    switch (action) {
      case 'edit':
        openScheduleEditor(date)
        break
      case 'timecard':
        navigate(`/timecard/${date}`)
        break
      case 'history':
        handleSelectDate(date)
        break
      case 'copy':
        copyScheduleDetails(date)
        break
      case 'paste':
        handlePasteTimecard(date)
        break
      default:
        break
    }
  }



  const copyScheduleDetails = async (targetDate: string) => {
    const entry = schedule?.scheduleData[targetDate]
    const record = timeRecords[targetDate]
    const summary = record
      ? [
        `Date: ${targetDate}`,
        `DayType: ${record.dayType}`,
        record.actualStartTime ? `Start: ${record.actualStartTime}` : null,
        record.actualEndTime ? `End: ${record.actualEndTime}` : null,
        `Rest: ${record.restHours ?? 0}`,
        record.notes ? `Notes: ${record.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
      : [
        `Date: ${targetDate}`,
        entry?.type ? `Type: ${entry.type}` : null,
        entry?.plannedStartTime ? `Start: ${entry.plannedStartTime}` : null,
        entry?.plannedEndTime ? `End: ${entry.plannedEndTime}` : null,
        entry?.notes ? `Notes: ${entry.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    try {
      await navigator.clipboard.writeText(summary || `Date: ${targetDate}`)
      showToast({
        title: 'Copied schedule details',
        description: targetDate,
        variant: 'success',
      })
      clipboardRef.current = targetDate
      clipboardRecordRef.current = timeRecords[targetDate] ?? null
    } catch {
      showToast({
        title: 'Copy failed',
        description: 'Unable to copy automatically. Please copy manually.',
        variant: 'warning',
      })
    }
  }

  const handlePasteTimecard = async (targetDate: string) => {
    const sourceDate = clipboardRef.current
    if (!sourceDate || (!clipboardRecordRef.current && !timeRecords[sourceDate])) {
      showToast({
        title: 'No copied entry',
        description: 'Copy Details first, then paste into another day.',
        variant: 'warning',
      })
      return
    }
    const sourceRecord = timeRecords[sourceDate] ?? clipboardRecordRef.current
    if (!sourceRecord) {
      showToast({
        title: 'Nothing to paste',
        description: 'Copied day has no timecard to paste.',
        variant: 'warning',
      })
      return
    }
    try {
      const destination = timeRecords[targetDate]
      const basePayload = {
        dayType: sourceRecord.dayType,
        actualStartTime: sourceRecord.actualStartTime ?? null,
        actualEndTime: sourceRecord.actualEndTime ?? null,
        restHours: sourceRecord.restHours ?? 0,
        isEmployerRequested: sourceRecord.isEmployerRequested ?? false,
        isStatutoryRestDay: sourceRecord.isStatutoryRestDay ?? undefined,
        spansMidnight: sourceRecord.spansMidnight ?? false,
        hoursWorked: sourceRecord.hoursWorked ?? null,
        basePay: sourceRecord.basePay ?? null,
        overtimePay: sourceRecord.overtimePay ?? null,
        notes: sourceRecord.notes ?? null,
        isModified: true,
        date: targetDate,
      }

      if (destination?.id) {
        await updateTimeRecord(destination.id, basePayload)
      } else {
        await createTimeRecord({ ...basePayload, employeeId })
      }

      await loadMonthRecords(monthId, () => getMonthlyRecords(employeeId, monthId))
      showToast({
        title: 'Pasted timecard details',
        description: targetDate,
        variant: 'success',
      })
    } catch {
      showToast({
        title: 'Paste failed',
        description: 'Unable to apply copied timecard.',
        variant: 'error',
      })
    }
  }

  const handleRefresh = async () => {
    await Promise.all([
      refresh(),
      loadMonthRecords(monthId, () => getMonthlyRecords(employeeId, monthId)),
    ])
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <section className="calendar-page">
        {isOffline && (
          <div className="offline-banner">Offline mode: showing cached schedule data</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Current month</p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">{monthId}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              onClick={() => handleMonthChange('prev')}
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              onClick={() => handleMonthChange('next')}
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 ml-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-sm"
              onClick={() => setViewerOpen(true)}
            >
              <ImageIcon className="w-4 h-4" />
              View Roster
            </button> */}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center gap-3">
            <Info className="w-5 h-5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {isLoading && <Loading label="Refreshing roster" description="Fetching schedule data" />}

        <MonthCalendar
          month={monthId}
          schedule={schedule ?? undefined}
          timeRecords={timeRecords}
          selectedDate={detailDate}
          onSelectDate={handleSelectDate}
          onQuickAction={handleQuickAction}
          onMonthChange={handleMonthChange}
        />

        <DayDetailModal
          date={detailDate ?? ''}
          schedule={selectedEntry}
          isOpen={isDetailOpen && Boolean(detailDate)}
          onClose={() => setDetailOpen(false)}
          onEditSchedule={openScheduleEditor}
          onRecordTimecard={(date) => navigate(`/timecard/${date}`)}
          onCopyDetails={copyScheduleDetails}
          onPasteDetails={handlePasteTimecard}
        />

      </section>
    </PullToRefresh>
  )
}

export default CalendarPage
