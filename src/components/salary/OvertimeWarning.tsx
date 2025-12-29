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
    critical: '已超过 MOM 每月 72 小时加班上限，请调整后续班次。',
    high: '接近本月加班上限，建议调整或替换后续加班班次。',
    medium: '本月加班较多，请关注剩余可用小时数。',
    low: '已记录加班，请持续跟踪以避免超过每月 72 小时上限。',
    neutral: '本月尚未记录加班。',
  }

  const tone = warnings[0]?.message ?? messages[severity]

  return (
    <section className={`salary-warning salary-warning--${severity}`}>
      <header>
        <h3>加班监控</h3>
        <span>{hours.toFixed(1)}h / {limit}h</span>
      </header>
      <p>{tone}</p>
      {warnings.length > 1 && (
        <ul>
          {warnings.map((warning) => (
            <li key={warning.type + warning.message}>{warning.message}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default OvertimeWarning
