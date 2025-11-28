import type { SalaryOverview } from '@/hooks/useSalary'

interface OvertimeWarningProps {
  summary?: SalaryOverview
}

const getSeverity = (hours: number, limit: number) => {
  if (!limit) {
    return 'neutral'
  }
  if (hours >= limit) {
    return 'critical'
  }
  if (hours >= limit * 0.9) {
    return 'high'
  }
  if (hours >= limit * 0.75) {
    return 'medium'
  }
  if (hours > 0) {
    return 'low'
  }
  return 'neutral'
}

function OvertimeWarning({ summary }: OvertimeWarningProps) {
  const hours = summary?.result.calculationDetails.totalOvertimeHours ?? 0
  const limit = summary?.overtimeLimit ?? 72
  const severity = getSeverity(hours, limit)
  const warnings = summary?.result.compliance.warnings ?? []

  const messages: Record<string, string> = {
    critical: 'You have exceeded MOM’s 72h monthly overtime limit. Please adjust future shifts.',
    high: 'Approaching the monthly OT limit. Consider swapping upcoming OT shifts.',
    medium: 'OT usage is high this month. Monitor remaining hours closely.',
    low: 'Overtime recorded. Keep tracking to avoid breaching 72h monthly limit.',
    neutral: 'No overtime recorded for this month yet.',
  }

  const tone = warnings[0] ?? messages[severity]

  return (
    <section className={`salary-warning salary-warning--${severity}`}>
      <header>
        <h3>Overtime monitor</h3>
        <span>{hours.toFixed(1)}h / {limit}h</span>
      </header>
      <p>{tone}</p>
      {warnings.length > 1 && (
        <ul>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default OvertimeWarning
