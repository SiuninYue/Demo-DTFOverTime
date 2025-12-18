import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import Dock from '@/components/common/Dock'
import '@/App.css'

const resolveSectionTitle = (pathname: string) => {
  if (pathname.startsWith('/schedule')) return '导入排班'
  if (pathname.startsWith('/calendar')) return '日历'
  if (pathname.startsWith('/timecard')) return '打卡'
  if (pathname.startsWith('/salary')) return '工资'
  if (pathname.startsWith('/mc')) return '病假'
  if (pathname.startsWith('/settings')) return '设置'
  return '首页'
}

function RootLayout() {
  const navigation = useNavigation()
  const location = useLocation()
  const isNavigating = navigation.state !== 'idle'
  const sectionTitle = resolveSectionTitle(location.pathname)

  // Determine if we should hide nav on desktop or apply specific styles
  // The original BottomNav had 'hideOnDesktop={false}' logic.
  // We'll keep the menu visible.

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-0" data-navigation={isNavigating ? 'busy' : 'idle'}>
      {/* Mobile Header (Hidden on Desktop if using Sidebar, but currently we rely on Dock) */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b-0 rounded-none border-b border-white/20 px-6 py-4 flex items-center justify-between md:hidden">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white drop-shadow-sm">
          {sectionTitle}
        </h1>
        {isNavigating && (
          <span className="text-xs font-medium text-neutral-500 animate-pulse bg-white/50 px-2 py-1 rounded-full">
            同步中…
          </span>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-500 ease-out">
        <Outlet />
      </main>

      <Dock />
    </div>
  )
}

export default RootLayout
