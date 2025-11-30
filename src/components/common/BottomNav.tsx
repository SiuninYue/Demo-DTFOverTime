import { NavLink } from 'react-router-dom'

export interface BottomNavItem {
  to: string
  label: string
  icon?: string
  exact?: boolean
}

export interface BottomNavProps {
  items?: BottomNavItem[]
  className?: string
  hideOnDesktop?: boolean
}

const defaultItems: BottomNavItem[] = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓️' },
  { to: '/salary', label: 'Salary', icon: '💰' },
  { to: '/more', label: 'More', icon: '⋮' },
]

function BottomNav({ items = defaultItems, className = '', hideOnDesktop = true }: BottomNavProps) {
  return (
    <nav
      className={['bottom-nav', className].filter(Boolean).join(' ')}
      aria-label="Primary tabs"
      data-hide-desktop={hideOnDesktop}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            ['bottom-nav__link', isActive ? 'bottom-nav__link--active' : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          {item.icon && <span aria-hidden>{item.icon}</span>}
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
