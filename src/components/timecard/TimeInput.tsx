interface TimeInputProps {
  label: string
  value: string | null | undefined
  onChange: (value: string | null) => void
  helperText?: string
  disabled?: boolean
}

function TimeInput({ label, value, onChange, helperText, disabled = false }: TimeInputProps) {
  return (
    <label className="time-input">
      <span className="time-input__label">{label}</span>
      <input
        type="time"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={disabled}
      />
      {helperText && <span className="time-input__helper">{helperText}</span>}
    </label>
  )
}

export default TimeInput
