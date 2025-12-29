interface RestDayTimecardFormProps {
  isEmployerRequested: boolean
  onChange: (payload: { isEmployerRequested: boolean }) => void
  disabled?: boolean
}

function RestDayTimecardForm({
  isEmployerRequested,
  onChange,
  disabled = false,
}: RestDayTimecardFormProps) {
  return (
    <section className="rest-day-card">
      <header>
        <h3>休息日信息</h3>
      </header>
      <div className="rest-day-card__controls rest-day-card__controls--stacked">
        <label className="toggle">
          <input
            type="checkbox"
            checked={isEmployerRequested}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                isEmployerRequested: event.target.checked,
              })
            }
          />
          <span>雇主要求加班</span>
        </label>
      </div>
    </section>
  )
}

export default RestDayTimecardForm
