import { Link } from 'react-router-dom'

const moreLinks = [
  { to: '/timecard/today', label: 'Timecard', description: "Log today's hours or edit past days" },
  { to: '/mc', label: 'MC Records', description: 'Manage medical certificates and recovery days' },
  { to: '/schedule/import', label: 'Schedule Import', description: 'Upload roster images or spreadsheets' },
  { to: '/settings', label: 'Settings', description: 'Preferences, language, and account controls' },
]

function MorePage() {
  return (
    <section className="more-page">
      <header className="more-page__header">
        <h1>More</h1>
        <p className="text-muted">Quick access to timecards, MC, imports, and settings.</p>
      </header>

      <div className="more-grid">
        {moreLinks.map((item) => (
          <Link key={item.to} to={item.to} className="more-card">
            <div className="more-card__body">
              <h3>{item.label}</h3>
              <p className="text-muted">{item.description}</p>
            </div>
            <span aria-hidden className="more-card__chevron">
              &gt;
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default MorePage
