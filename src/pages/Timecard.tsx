import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TimeInput from '@/components/timecard/TimeInput'
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

  if (!params.dateId) {
    navigate(`/timecard/${date}`, { replace: true })
  }

  const { record, scheduleEntry, preview, updateField, setDayType, resetToSchedule, save, remove, isLoading, isSaving, error, hasChanges, normalHours } =
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
  const isStatutoryRestDay =
    record.dayType === DayType.REST_DAY ? record.isStatutoryRestDay ?? true : false
  const isPublicHoliday = record.dayType === DayType.PUBLIC_HOLIDAY
  const isUnpaidMc = record.dayType === DayType.MEDICAL_LEAVE && (record.notes?.includes(UNPAID_MC_TAG) ?? false)
  const isUnpaidLeave = record.dayType === DayType.ANNUAL_LEAVE && (record.notes?.includes(UNPAID_LEAVE_TAG) ?? false)
  const stripInternalTags = (value?: string | null) =>
    (value ?? '')
      .replaceAll(UNPAID_MC_TAG, '')
      .replaceAll(UNPAID_LEAVE_TAG, '')
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
        title: 'Offline mode',
        description: 'Reconnect to save your timecard changes.',
        variant: 'warning',
      })
      return
    }
    await save()
    showToast({ title: 'Timecard saved', description: date, variant: 'success' })
    navigate('/')
  }

  const handleFieldChange = <K extends keyof typeof record>(field: K, value: typeof record[K]) => {
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
        title: 'Offline mode',
        description: 'Reconnect to delete or edit timecards.',
        variant: 'warning',
      })
      return
    }
    await remove()
    showToast({ title: 'Timecard deleted', description: date, variant: 'info' })
  }

  const interactionDisabled = isLoading || isSaving || !isOnline

  return (
    <section className="timecard-page">
      {!isOnline && (
        <p className="offline-banner">
          Offline mode: You can review timecards, but saving or deleting requires a connection.
        </p>
      )}
      <div className="timecard-toolbar">
        <div>
          <p className="text-muted">Timecard date</p>
          <h1>{date}</h1>
          {plannedWindow && <p className="text-muted">Planned shift: {plannedWindow}</p>}
        </div>
        <div className="timecard-controls">
          <button type="button" className="ghost" onClick={() => navigate(`/timecard/${shiftDate(date, -1)}`)}>
            ◀ Previous Day
          </button>
          <button type="button" className="ghost" onClick={() => navigate(`/timecard/${shiftDate(date, 1)}`)}>
            Next Day ▶
          </button>
          <button type="button" className="ghost" onClick={() => resetToSchedule()} disabled={isLoading}>
            Reset to Schedule
          </button>
        </div>
      </div>

      {error && <p className="upload-error">⚠️ {error}</p>}

      <form
        className="timecard-form"
        onSubmit={(event) => {
          event.preventDefault()
          handleSaveAndExit().catch(() => {})
        }}
      >
        <label className="time-input">
          <span className="time-input__label">Day Type</span>
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
              }
            }}
            disabled={interactionDisabled}
          >
            <option value={DayType.NORMAL_WORK_DAY}>Normal Work Day</option>
            <option value={DayType.REST_DAY}>Rest Day</option>
            <option value={DayType.OFF_DAY}>Off Day</option>
            <option value={DayType.PUBLIC_HOLIDAY}>Public Holiday</option>
            <option value={DayType.ANNUAL_LEAVE}>Annual Leave (Paid)</option>
            <option value={DayType.MEDICAL_LEAVE}>Medical Leave (Paid)</option>
            {isUnpaidMc && (
              <option value={UNPAID_MC_OPTION} disabled>
                Medical Leave (Unpaid)
              </option>
            )}
            {isUnpaidLeave && (
              <option value={UNPAID_LEAVE_OPTION} disabled>
                Unpaid Leave
              </option>
            )}
          </select>
        </label>

        <TimeInput
          label="Actual Start"
          value={record.actualStartTime}
          onChange={(value) => handleFieldChange('actualStartTime', value)}
          helperText="Tap to adjust actual clock-in time"
          disabled={interactionDisabled}
        />

        <TimeInput
          label="Actual End"
          value={record.actualEndTime}
          onChange={(value) => handleFieldChange('actualEndTime', value)}
          helperText="Required to compute hours"
          disabled={interactionDisabled}
        />

        <label className="time-input">
          <span className="time-input__label">Rest Hours</span>
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
            onChange={(event) => handleFieldChange('spansMidnight', event.target.checked)}
            disabled={interactionDisabled}
          />
          <span>Shift spans midnight</span>
        </label>

      <label className="time-input" style={{ gridColumn: '1 / -1' }}>
        <span className="time-input__label">Notes</span>
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
          <span>Mark as unpaid MC</span>
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
          <span>Mark as unpaid leave</span>
        </label>
      )}
      </form>

      {isRestOrOffDay && (
        <RestDayTimecardForm
          dayType={record.dayType}
          isStatutoryRestDay={isStatutoryRestDay}
          isEmployerRequested={record.isEmployerRequested ?? true}
          disabled={interactionDisabled}
          onChange={({ dayType, isStatutoryRestDay: nextStatRestDay, isEmployerRequested }) => {
            setDayType(dayType)
            handleFieldChange('isStatutoryRestDay', nextStatRestDay)
            handleFieldChange('isEmployerRequested', isEmployerRequested)
          }}
        />
      )}

      {isPublicHoliday && <PHTimecardForm normalHours={normalHours} />}

      <SalaryPreview preview={preview} dayType={record.dayType} isSaving={isSaving} />

      <div className="timecard-controls">
        <button
          type="button"
          className="secondary"
          disabled={isSaving || !hasChanges || !isOnline}
          onClick={() => handleSaveAndExit().catch(() => {})}
        >
          Save &amp; Return Home
        </button>
        <button type="button" className="ghost" onClick={() => handleDelete().catch(() => {})} disabled={isSaving || !isOnline}>
          Delete Record
        </button>
      </div>

      {isSaving && <Loading label="Saving timecard" description="Applying MOM compliance rules" />}
    </section>
  )
}

export default TimecardPage
