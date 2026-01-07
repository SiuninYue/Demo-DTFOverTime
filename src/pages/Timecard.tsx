import { useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PullToRefresh from '@/components/common/PullToRefresh'
import SmartTimeInput from '@/components/timecard/SmartTimeInput'
import RestDayTimecardForm from '@/components/timecard/RestDayTimecardForm'
import PHTimecardForm from '@/components/timecard/PHTimecardForm'
import SalaryPreview from '@/components/timecard/SalaryPreview'
import { DayType } from '@/types/timecard'
import { useTimecard } from '@/hooks/useTimecard'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useToast } from '@/components/common/Toast'
import Loading from '@/components/common/Loading'
import { DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useAuthStore } from '@/store/authStore'

const formatDate = (date: Date) => date.toISOString().slice(0, 10)
const UNPAID_MC_TAG = '[UNPAID_MC]'
const UNPAID_LEAVE_TAG = '[UNPAID_LEAVE]'
const UNPAID_MC_OPTION = 'UNPAID_MC'
const UNPAID_LEAVE_OPTION = 'UNPAID_LEAVE'

const shiftDate = (date: string, delta: number) => {
  const base = new Date(`${date}T00:00:00Z`)
  const shifted = new Date(base.getTime() + delta * 24 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

function TimecardPage() {
  const params = useParams<{ dateId?: string }>()
  const navigate = useNavigate()
  const today = formatDate(new Date())
  const date = params.dateId ?? today
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID

  useEffect(() => {
    if (!params.dateId) {
      navigate(`/timecard/${date}`, { replace: true })
    }
  }, [date, navigate, params.dateId])

  const { record, scheduleEntry, preview, updateField, setDayType, resetToSchedule, refresh, save, remove, isLoading, isSaving, error, hasChanges, normalHours } =
    useTimecard({
      employeeId,
      date,
    })
  const { isOnline } = useNetworkStatus()
  const { showToast } = useToast()

  const plannedWindow = useMemo(() => {
    if (!scheduleEntry) return null
    if (!scheduleEntry.plannedStartTime && !scheduleEntry.plannedEndTime) return null
    return `${scheduleEntry.plannedStartTime ?? '--'} — ${scheduleEntry.plannedEndTime ?? '--'}`
  }, [scheduleEntry])

  const isRestOrOffDay = record.dayType === DayType.REST_DAY || record.dayType === DayType.OFF_DAY
  const isLeaveOrHolidayDay =
    record.dayType === DayType.PUBLIC_HOLIDAY ||
    record.dayType === DayType.ANNUAL_LEAVE ||
    record.dayType === DayType.MEDICAL_LEAVE
  const isNonWorkDay = isRestOrOffDay || isLeaveOrHolidayDay
  const isEmployerRequested = record.isEmployerRequested ?? false
  const showWorkDetails = !isNonWorkDay || isEmployerRequested
  const isPublicHoliday = record.dayType === DayType.PUBLIC_HOLIDAY
  const isUnpaidMc = record.dayType === DayType.MEDICAL_LEAVE && (record.notes?.includes(UNPAID_MC_TAG) ?? false)
  const isUnpaidLeave = record.dayType === DayType.ANNUAL_LEAVE && (record.notes?.includes(UNPAID_LEAVE_TAG) ?? false)
  const stripInternalTags = (value?: string | null) =>
    (value ?? '')
      .replace(/\[UNPAID_MC\]/g, '')
      .replace(/\[UNPAID_LEAVE\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const joinNotesWithTags = (body: string, unpaidMc: boolean, unpaidLeave: boolean) =>
    [unpaidMc ? UNPAID_MC_TAG : null, unpaidLeave ? UNPAID_LEAVE_TAG : null, body.trim()]
      .filter(Boolean)
      .join(' ')
      .trim()

  const handleSaveAndExit = async () => {
    if (!isOnline) {
      showToast({
        title: '离线模式',
        description: '请连接网络后再保存打卡变更。',
        variant: 'warning',
      })
      return
    }
    await save()
    showToast({ title: '打卡已保存', description: date, variant: 'success' })
    navigate('/calendar')
  }

  const handleFieldChange = <K extends keyof Omit<typeof record, 'id'>>(field: K, value: typeof record[K]) => {
    updateField(field, value)
  }

  const setUnpaidMc = (value: boolean) => {
    const body = stripInternalTags(record.notes)
    const nextNotes = joinNotesWithTags(body, value, isUnpaidLeave)
    handleFieldChange('notes', nextNotes || undefined)
  }

  const setUnpaidLeave = (value: boolean) => {
    const body = stripInternalTags(record.notes)
    const nextNotes = joinNotesWithTags(body, isUnpaidMc, value)
    handleFieldChange('notes', nextNotes || undefined)
  }

  const clearWorkDetails = () => {
    handleFieldChange('actualStartTime', null)
    handleFieldChange('actualEndTime', null)
    handleFieldChange('restHours', 0)
    handleFieldChange('spansMidnight', false)
  }

  const getDayTypeSelectValue = () => {
    if (record.dayType === DayType.MEDICAL_LEAVE && isUnpaidMc) {
      return UNPAID_MC_OPTION
    }
    if (record.dayType === DayType.ANNUAL_LEAVE && isUnpaidLeave) {
      return UNPAID_LEAVE_OPTION
    }
    return record.dayType
  }

  const handleDelete = async () => {
    if (!isOnline) {
      showToast({
        title: '离线模式',
        description: '请连接网络后再删除或编辑打卡记录。',
        variant: 'warning',
      })
      return
    }
    await remove()
    showToast({ title: '打卡已删除', description: date, variant: 'info' })
  }

  const interactionDisabled = isLoading || isSaving || !isOnline

  return (
    <PullToRefresh onRefresh={refresh}>
      <section className="timecard-page">
        {!isOnline && (
          <p className="offline-banner">
            离线模式：可查看打卡记录，但保存或删除需要网络连接。
          </p>
        )}
        <div className="timecard-toolbar">
          <div>
            <p className="text-muted">打卡日期</p>
            <h1>{date}</h1>
            {plannedWindow && <p className="text-muted">计划班次：{plannedWindow}</p>}
          </div>
          <div className="timecard-controls">
            <button type="button" className="ghost" onClick={() => navigate(`/timecard/${shiftDate(date, -1)}`)}>
              前一天
            </button>
            <button type="button" className="ghost" onClick={() => navigate(`/timecard/${shiftDate(date, 1)}`)}>
              后一天
            </button>
            <button type="button" className="ghost" onClick={() => resetToSchedule()} disabled={isLoading}>
              重置为排班
            </button>
          </div>
        </div>

        {error && <p className="upload-error">错误：{error}</p>}

        <form
          className="timecard-form"
          onSubmit={(event) => {
            event.preventDefault()
            handleSaveAndExit().catch(() => { })
          }}
        >
          <label className="time-input">
            <span className="time-input__label">日期类型</span>
            <select
              value={getDayTypeSelectValue()}
              onChange={(event) => {
                const value = event.target.value
                if (value === UNPAID_MC_OPTION) {
                  setDayType(DayType.MEDICAL_LEAVE)
                  setUnpaidMc(true)
                  setUnpaidLeave(false)
                } else if (value === UNPAID_LEAVE_OPTION) {
                  setDayType(DayType.ANNUAL_LEAVE)
                  setUnpaidLeave(true)
                  setUnpaidMc(false)
                } else {
                  setUnpaidMc(false)
                  setUnpaidLeave(false)
                  setDayType(value as DayType)
                  const nextDayType = value as DayType
                  const isRestLike =
                    nextDayType === DayType.REST_DAY ||
                    nextDayType === DayType.OFF_DAY ||
                    nextDayType === DayType.PUBLIC_HOLIDAY ||
                    nextDayType === DayType.ANNUAL_LEAVE ||
                    nextDayType === DayType.MEDICAL_LEAVE
                  if (isRestLike) {
                    handleFieldChange('isEmployerRequested', false)
                    clearWorkDetails()
                  }
                }
              }}
              disabled={interactionDisabled}
            >
              <option value={DayType.NORMAL_WORK_DAY}>正常工作</option>
              <option value={DayType.REST_DAY}>休息</option>
              <option value={DayType.OFF_DAY}>补休/调休</option>
              <option value={DayType.PUBLIC_HOLIDAY}>公假</option>
              <option value={DayType.ANNUAL_LEAVE}>年假（带薪）</option>
              <option value={DayType.MEDICAL_LEAVE}>病假（带薪）</option>
              {isUnpaidMc && (
                <option value={UNPAID_MC_OPTION} disabled>
                  病假（不带薪）
                </option>
              )}
              {isUnpaidLeave && (
                <option value={UNPAID_LEAVE_OPTION} disabled>
                  不带薪假
                </option>
              )}
            </select>
          </label>

          {showWorkDetails ? (
            <>
              <SmartTimeInput
                label="实际开始"
                value={record.actualStartTime}
                onChange={(value) => handleFieldChange('actualStartTime', value)}
                disabled={interactionDisabled}
              />

              <SmartTimeInput
                label="实际结束"
                value={record.actualEndTime}
                onChange={(value) => handleFieldChange('actualEndTime', value)}
                disabled={interactionDisabled}
              />

              <label className="time-input">
                <span className="time-input__label">休息时数</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.25}
                  value={record.restHours}
                  onChange={(event) => handleFieldChange('restHours', Number(event.target.value))}
                  disabled={interactionDisabled}
                />
              </label>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={record.spansMidnight ?? false}
                  onChange={(event) =>
                    handleFieldChange('spansMidnight', event.target.checked)
                  }
                  disabled={interactionDisabled}
                />
                <span>跨夜班次</span>
              </label>
            </>
          ) : (
            <p className="text-muted" style={{ gridColumn: '1 / -1', marginTop: '0.25rem' }}>
              休息无需填写工时信息，勾选「雇主要求加班」后才需要填写。
            </p>
          )}

          <label className="time-input" style={{ gridColumn: '1 / -1' }}>
            <span className="time-input__label">备注</span>
            <textarea
              value={stripInternalTags(record.notes)}
              onChange={(event) => {
                const body = event.target.value ?? ''
                const nextNotes = joinNotesWithTags(body, isUnpaidMc, isUnpaidLeave)
                handleFieldChange('notes', nextNotes || undefined)
              }}
              rows={3}
              disabled={interactionDisabled}
            />
          </label>

          {record.dayType === DayType.MEDICAL_LEAVE && (
            <label className="toggle" style={{ gridColumn: '1 / -1' }}>
              <input
                type="checkbox"
                checked={isUnpaidMc}
                onChange={(event) => setUnpaidMc(event.target.checked)}
                disabled={interactionDisabled}
              />
              <span>标记为不带薪病假</span>
            </label>
          )}
          {record.dayType === DayType.ANNUAL_LEAVE && (
            <label className="toggle" style={{ gridColumn: '1 / -1' }}>
              <input
                type="checkbox"
                checked={isUnpaidLeave}
                onChange={(event) => setUnpaidLeave(event.target.checked)}
                disabled={interactionDisabled}
              />
              <span>标记为不带薪假</span>
            </label>
          )}
        </form>

        {isRestOrOffDay && (
          <RestDayTimecardForm
            isEmployerRequested={isEmployerRequested}
            disabled={interactionDisabled}
            onChange={({ isEmployerRequested }) => {
              handleFieldChange('isEmployerRequested', isEmployerRequested)
              if (!isEmployerRequested) {
                clearWorkDetails()
              }
            }}
          />
        )}

        {isPublicHoliday && <PHTimecardForm normalHours={normalHours} />}

        <SalaryPreview preview={preview} dayType={record.dayType} isSaving={isSaving} />

        <div className="timecard-controls">
          <button
            type="button"
            className="ghost"
            disabled={isSaving || !hasChanges || !isOnline}
            onClick={() => handleSaveAndExit().catch(() => { })}
          >
            保存
          </button>
          <button type="button" className="ghost" onClick={() => handleDelete().catch(() => { })} disabled={isSaving || !isOnline}>
            删除记录
          </button>
        </div>

        {isSaving && <Loading label="正在保存打卡" description="正在应用 MOM 合规规则" />}
      </section>
    </PullToRefresh>
  )
}

export default TimecardPage
