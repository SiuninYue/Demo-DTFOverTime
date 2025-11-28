import { NavLink, Outlet, useLocation, useNavigation } from 'react-router-dom'
import BottomNav from '@/components/common/BottomNav'
import '@/App.css'

const desktopNavItems = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/schedule/import', label: 'Schedule Import' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/timecard/today', label: 'Timecard' },
  { to: '/salary', label: 'Salary' },
  { to: '/mc', label: 'MC' },
  { to: '/settings', label: 'Settings' },
]

const bottomNavItems = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓' },
  { to: '/salary', label: 'Salary', icon: '💰' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

const resolveSectionTitle = (pathname: string) => {
  if (pathname.startsWith('/schedule')) return 'Schedule Import'
  if (pathname.startsWith('/calendar')) return 'Calendar Overview'
  if (pathname.startsWith('/timecard')) return 'Timecard Entry'
  if (pathname.startsWith('/salary')) return 'Salary Breakdown'
  if (pathname.startsWith('/mc')) return 'MC Records'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Dashboard'
}

function RootLayout() {
  const navigation = useNavigation()
  const location = useLocation()
  const isNavigating = navigation.state !== 'idle'
  const sectionTitle = resolveSectionTitle(location.pathname)

  return (
    <div className="app-shell" data-navigation={isNavigating ? 'busy' : 'idle'}>
      <header className="app-header">
        <div>
          <p className="app-subtitle">DTF Salary Tracker</p>
          <div className="app-header__title-row">
            <h1 className="app-title">{sectionTitle}</h1>
            {isNavigating && <span className="app-loading-indicator">Syncing…</span>}
          </div>
          <p className="app-description">
            Track rosters, capture timecards, and validate MOM-compliant salary breakdowns.
          </p>
        </div>
        <nav className="app-nav" aria-label="Primary navigation">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                ['app-nav-link', isActive ? 'app-nav-link--active' : ''].filter(Boolean).join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-content" role="main">
        <Outlet />
      </main>

      <BottomNav items={bottomNavItems} />
    </div>
  )
}

export default RootLayout
