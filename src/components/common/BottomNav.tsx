import React from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, Home, PanelsTopLeft, Wallet2 } from 'lucide-react'

export interface BottomNavItem {
  to: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

export interface BottomNavProps {
  items?: BottomNavItem[]
  className?: string
  hideOnDesktop?: boolean
}

const defaultItems: BottomNavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-6 w-6" strokeWidth={2.4} />, exact: true },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="h-6 w-6" strokeWidth={2.3} /> },
  { to: '/salary', label: 'Salary', icon: <Wallet2 className="h-6 w-6" strokeWidth={2.3} /> },
  { to: '/more', label: 'More', icon: <PanelsTopLeft className="h-6 w-6" strokeWidth={2.3} /> },
]

function BottomNav({ items = defaultItems, className = '', hideOnDesktop = false }: BottomNavProps) {
  const shellClassName = [
    'floating-dock',
    'fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const navClassName = [
    'floating-dock__nav',
    'pointer-events-auto flex items-center justify-around w-full',
    'bg-white/90 backdrop-blur-lg border-t border-slate-200/60 px-3 pt-2 pb-3',
    'md:w-auto md:min-w-[320px] md:mb-8 md:rounded-2xl md:border md:border-white/60',
    'md:shadow-[0_10px_35px_rgba(15,23,42,0.18)] md:bg-white/80 md:px-6 md:pt-2 md:pb-2',
    hideOnDesktop ? 'md:hidden' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClassName}>
      <nav
        className={navClassName}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.35rem)' }}
        aria-label="Primary tabs"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className="floating-dock__item group relative flex w-full flex-col items-center justify-center rounded-xl p-2 transition-all duration-200 hover:bg-slate-100/70 active:scale-95 md:mx-1 md:w-16 no-underline"
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'mb-1 text-2xl transition-transform duration-300',
                    isActive ? 'scale-110 text-brand-600' : 'text-slate-500 opacity-80 group-hover:opacity-100',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span
                  className={[
                    'text-[11px] font-semibold tracking-wide transition-all duration-200',
                    isActive ? 'text-brand-600' : 'text-slate-500 opacity-80',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-1 right-1/2 h-1.5 w-1.5 translate-x-4 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(37,99,235,0.55)] md:hidden" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default BottomNav
