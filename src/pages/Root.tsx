import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import BottomNav from '@/components/common/BottomNav'
import '@/App.css'

import { CalendarDays, Home, PanelsTopLeft, Wallet2 } from 'lucide-react'

const bottomNavItems = [
  { to: '/', label: 'Home', icon: <Home className="h-6 w-6" strokeWidth={2.4} />, exact: true },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="h-6 w-6" strokeWidth={2.3} /> },
  { to: '/salary', label: 'Salary', icon: <Wallet2 className="h-6 w-6" strokeWidth={2.3} /> },
  { to: '/more', label: 'More', icon: <PanelsTopLeft className="h-6 w-6" strokeWidth={2.3} /> },
]

const resolveSectionTitle = (pathname: string) => {
  if (pathname.startsWith('/schedule')) return 'Schedule Import'
  if (pathname.startsWith('/calendar')) return 'Calendar Overview'
  if (pathname.startsWith('/timecard')) return 'Timecard Entry'
  if (pathname.startsWith('/salary')) return 'Salary Breakdown'
  if (pathname.startsWith('/mc')) return 'MC Records'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/more')) return 'More'
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
        <div className="app-header__title-row">
          <h1 className="app-title">{sectionTitle}</h1>
          {isNavigating && (
            <span className="app-loading-indicator" aria-live="polite">
              Syncing...
            </span>
          )}
        </div>
      </header>

      <main className="app-content" role="main">
        <Outlet />
      </main>

      <BottomNav items={bottomNavItems} hideOnDesktop={false} />
    </div>
  )
}

export default RootLayout
