interface YearlyMCQuotaProps {
  usedDays: number
  quota: number
  isLoading?: boolean
}

const MOM_REFERENCE = 'https://www.mom.gov.sg/employment-practices/leave/medical-leave'

function YearlyMCQuota({ usedDays, quota, isLoading }: YearlyMCQuotaProps) {
  const ratio = quota ? Math.min(100, (usedDays / quota) * 100) : 0
  const remaining = Math.max(0, quota - usedDays)

  return (
    <section className="mc-card">
      <header className="mc-card__header">
        <div>
          <p className="label">Yearly MC quota</p>
          <h3>
            {isLoading ? 'Syncing…' : `${usedDays}/${quota} days`}
          </h3>
        </div>
        {remaining === 0 && <span className="badge badge--rest">Quota reached</span>}
      </header>
      <div className="mc-progress">
        <div className="mc-progress__bar" aria-hidden="true">
          <span style={{ width: `${ratio}%` }} />
        </div>
        <p className="text-muted">{remaining} days remaining before the annual MOM limit.</p>
      </div>
      <p className="text-muted">
        MOM allows up to 14 days of outpatient MC per year. Additional days require HR approval and may
        suspend attendance bonuses.{' '}
        <a href={MOM_REFERENCE} target="_blank" rel="noreferrer">
          Learn more
        </a>
        .
      </p>
    </section>
  )
}

export default YearlyMCQuota
