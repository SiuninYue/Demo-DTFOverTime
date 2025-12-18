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
          <p className="label">年度病假额度</p>
          <h3>
            {isLoading ? '同步中…' : `${usedDays}/${quota} 天`}
          </h3>
        </div>
        {remaining === 0 && <span className="badge badge--rest">已用完额度</span>}
      </header>
      <div className="mc-progress">
        <div className="mc-progress__bar" aria-hidden="true">
          <span style={{ width: `${ratio}%` }} />
        </div>
        <p className="text-muted">距离年度 MOM 上限还剩 {remaining} 天。</p>
      </div>
      <p className="text-muted">
        MOM 每年允许最多 14 天门诊病假；超出天数需 HR 批准，并可能影响全勤奖发放。{' '}
        <a href={MOM_REFERENCE} target="_blank" rel="noreferrer">
          了解更多
        </a>
        .
      </p>
    </section>
  )
}

export default YearlyMCQuota
