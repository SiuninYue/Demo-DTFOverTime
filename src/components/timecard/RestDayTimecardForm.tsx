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
        <h3>休息日信息</h3>
        <p className="text-muted">
          MOM 规则：法定休息日按 0/0.5/1/2 天 + 加班计算；补休日加班仅按 1.5× 工时计算。
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
            <span>休息日</span>
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
            <span>补休（调休）</span>
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
            <span>法定休息日（可按休息日加班规则计算）</span>
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
          <span>雇主要求加班</span>
        </label>
        {!isStatutoryRestDay && (
          <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
            补休日加班：全部工作时数按 1.5× 计为加班。
          </p>
        )}
      </div>
    </section>
  )
}

export default RestDayTimecardForm
