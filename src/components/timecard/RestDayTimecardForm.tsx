import { DayType } from '@/types/timecard'

interface RestDayTimecardFormProps {
  dayType: DayType
  isStatutoryRestDay: boolean
  isEmployerRequested: boolean
  onChange: (payload: {
    dayType: DayType
    isStatutoryRestDay: boolean
    isEmployerRequested: boolean
  }) => void
  disabled?: boolean
}

function RestDayTimecardForm({
  dayType,
  isStatutoryRestDay,
  isEmployerRequested,
  onChange,
  disabled = false,
}: RestDayTimecardFormProps) {
  return (
    <section className="rest-day-card">
      <header>
        <h3>Rest Day Details</h3>
        <p className="text-muted">
          MOM rules: Statutory rest day pay uses 0/0.5/1/2 day + OT; Off day overtime is 1.5x hours
          only.
        </p>
      </header>
      <div className="rest-day-card__controls rest-day-card__controls--stacked">
        <div className="rest-day-card__switch">
          <label className="toggle">
            <input
              type="radio"
              name="rest-day-type"
              checked={dayType === DayType.REST_DAY}
              disabled={disabled}
              onChange={() =>
                onChange({
                  dayType: DayType.REST_DAY,
                  isStatutoryRestDay: isStatutoryRestDay,
                  isEmployerRequested,
                })
              }
            />
            <span>Rest Day</span>
          </label>
          <label className="toggle">
            <input
              type="radio"
              name="rest-day-type"
              checked={dayType === DayType.OFF_DAY}
              disabled={disabled}
              onChange={() =>
                onChange({
                  dayType: DayType.OFF_DAY,
                  isStatutoryRestDay: false,
                  isEmployerRequested,
                })
              }
            />
            <span>Off Day (off-in-lieu)</span>
          </label>
        </div>
        {dayType === DayType.REST_DAY && (
          <label className="toggle">
            <input
              type="checkbox"
              checked={isStatutoryRestDay}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  dayType,
                  isStatutoryRestDay: event.target.checked,
                  isEmployerRequested,
                })
              }
            />
            <span>Statutory Rest Day (eligible for rest-day OT)</span>
          </label>
        )}
        <label className="toggle">
          <input
            type="checkbox"
            checked={isEmployerRequested}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                dayType,
                isStatutoryRestDay,
                isEmployerRequested: event.target.checked,
              })
            }
          />
          <span>Employer requested overtime</span>
        </label>
        {!isStatutoryRestDay && (
          <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
            Off day OT: all working hours count as overtime at 1.5x.
          </p>
        )}
      </div>
    </section>
  )
}

export default RestDayTimecardForm
