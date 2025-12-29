import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
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
import { DayType, type TimeRecordInput, type TimeRecord } from '@/types/timecard'
import type { DaySchedule } from '@/types/schedule'

const getCurrentMonthId = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY_OBJECT: Record<string, TimeRecord> = {}

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
  const timeRecords = useTimecardStore((state) => state.recordsByMonth[monthId] ?? EMPTY_OBJECT)
  const loadMonthRecords = useTimecardStore((state) => state.loadMonth)
  const timecardStatus = useTimecardStore((state) => state.statusByMonth[monthId] ?? 'idle')
  const upsertRecord = useTimecardStore((state) => state.upsertRecord)
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

  const { schedule, isLoading, error, isOffline, refresh } = useSchedule({
    employeeId,
    month: monthId,
  })

  const [detailDate, setDetailDate] = useState<string | null>(null)
  const [isDetailOpen, setDetailOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const { showToast } = useToast()

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

  const scheduleToDayType = (entry?: DaySchedule): DayType => {
    if (!entry) return DayType.NORMAL_WORK_DAY
    if (entry.type === 'rest') {
      return entry.isStatutoryRestDay ? DayType.REST_DAY : DayType.OFF_DAY
    }
    if (entry.type === 'off') return DayType.OFF_DAY
    if (entry.type === 'public_holiday') return DayType.PUBLIC_HOLIDAY
    if (entry.type === 'leave') return DayType.ANNUAL_LEAVE
    if (entry.type === 'unknown') return DayType.NORMAL_WORK_DAY
    return DayType.NORMAL_WORK_DAY
  }

  const getConfirmLabel = (entry?: DaySchedule) => {
    const dayType = scheduleToDayType(entry)
    switch (dayType) {
      case DayType.OFF_DAY:
      case DayType.REST_DAY:
        return '确认休息'
      case DayType.PUBLIC_HOLIDAY:
        return '确认公假'
      case DayType.ANNUAL_LEAVE:
        return '确认年假'
      case DayType.MEDICAL_LEAVE:
        return '确认病假'
      default:
        return '确认出勤'
    }
  }

  const buildAutoTimecardPayload = (
    date: string,
    entry: DaySchedule,
    existing?: TimeRecord,
  ): TimeRecordInput => {
    const dayType = scheduleToDayType(entry)
    const isWorkDay = dayType === DayType.NORMAL_WORK_DAY
    const shouldUsePlannedTimes = isWorkDay
    return {
      date,
      dayType,
      isStatutoryRestDay: dayType === DayType.REST_DAY,
      actualStartTime: shouldUsePlannedTimes ? entry.plannedStartTime ?? null : null,
      actualEndTime: shouldUsePlannedTimes ? entry.plannedEndTime ?? null : null,
      restHours: isWorkDay ? existing?.restHours ?? 1 : 0,
      isEmployerRequested: isWorkDay ? existing?.isEmployerRequested ?? true : false,
      spansMidnight: existing?.spansMidnight ?? false,
      hoursWorked: existing?.hoursWorked ?? null,
      basePay: existing?.basePay ?? null,
      overtimePay: existing?.overtimePay ?? null,
      notes: existing?.notes ?? null,
      isModified: existing?.id ? true : undefined,
    }
  }

  const canQuickConfirm =
    selectedEntry &&
    (scheduleToDayType(selectedEntry) !== DayType.NORMAL_WORK_DAY ||
      Boolean(selectedEntry.plannedStartTime && selectedEntry.plannedEndTime))

  const handleConfirmAttendance = async () => {
    if (!detailDate || !selectedEntry) {
      setDetailOpen(false)
      return
    }

    if (!canQuickConfirm) {
      setDetailOpen(false)
      return
    }

    if (isConfirming) {
      return
    }

    setIsConfirming(true)
    try {
      const existing = timeRecords[detailDate]
      const payload = buildAutoTimecardPayload(detailDate, selectedEntry, existing)

      if (existing?.id) {
        const sameAsPlanned =
          existing.dayType === payload.dayType &&
          existing.actualStartTime === payload.actualStartTime &&
          existing.actualEndTime === payload.actualEndTime

        if (sameAsPlanned) {
          showToast({
            title: '已确认出勤',
            description: detailDate,
            variant: 'success',
          })
          setDetailOpen(false)
          return
        }

        const saved = await updateTimeRecord(existing.id, payload)
        upsertRecord(saved)
      } else {
        const saved = await createTimeRecord({ ...payload, employeeId })
        upsertRecord(saved)
      }

      showToast({
        title: '出勤已确认',
        description: detailDate,
        variant: 'success',
      })
      setDetailOpen(false)
    } catch {
      showToast({
        title: '确认失败',
        description: '无法保存当天的出勤记录，请稍后重试。',
        variant: 'error',
      })
    } finally {
      setIsConfirming(false)
    }
  }



  const copyScheduleDetails = async (targetDate: string) => {
    const entry = schedule?.scheduleData[targetDate]
    const record = timeRecords[targetDate]
    const summary = record
      ? [
        `日期：${targetDate}`,
        `类型：${record.dayType}`,
        record.actualStartTime ? `开始：${record.actualStartTime}` : null,
        record.actualEndTime ? `结束：${record.actualEndTime}` : null,
        `休息：${record.restHours ?? 0}`,
        record.notes ? `备注：${record.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
      : [
        `日期：${targetDate}`,
        entry?.type ? `类型：${entry.type}` : null,
        entry?.plannedStartTime ? `开始：${entry.plannedStartTime}` : null,
        entry?.plannedEndTime ? `结束：${entry.plannedEndTime}` : null,
        entry?.notes ? `备注：${entry.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    try {
      await navigator.clipboard.writeText(summary || `日期：${targetDate}`)
      showToast({
        title: '已复制',
        description: targetDate,
        variant: 'success',
      })
      clipboardRef.current = targetDate
      clipboardRecordRef.current = timeRecords[targetDate] ?? null
    } catch {
      showToast({
        title: '复制失败',
        description: '无法自动复制，请手动复制。',
        variant: 'warning',
      })
    }
  }

  const handlePasteTimecard = async (targetDate: string) => {
    const sourceDate = clipboardRef.current
    if (!sourceDate || (!clipboardRecordRef.current && !timeRecords[sourceDate])) {
      showToast({
        title: '没有可粘贴的内容',
        description: '请先复制，再粘贴到其他日期。',
        variant: 'warning',
      })
      return
    }
    const sourceRecord = timeRecords[sourceDate] ?? clipboardRecordRef.current
    if (!sourceRecord) {
      showToast({
        title: '没有可粘贴的内容',
        description: '已复制的日期没有打卡记录。',
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
        title: '已粘贴',
        description: targetDate,
        variant: 'success',
      })
    } catch {
      showToast({
        title: '粘贴失败',
        description: '无法应用已复制的打卡记录。',
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
          <div className="offline-banner">离线模式：正在显示缓存的排班数据</div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center gap-3">
            <Info className="w-5 h-5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {isLoading && <Loading label="正在刷新排班" description="正在获取排班数据" />}

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
          quickConfirmLabel={getConfirmLabel(selectedEntry)}
          quickConfirmDisabled={isConfirming}
          onQuickConfirm={canQuickConfirm ? handleConfirmAttendance : undefined}
        />

      </section>
    </PullToRefresh>
  )
}

export default CalendarPage
