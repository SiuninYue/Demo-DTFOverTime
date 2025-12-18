import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react'

type IconComponentType = React.ElementType<{ className?: string }>
export interface InteractiveMenuItem {
  label: string
  icon: IconComponentType
  to?: string
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[]
  accentColor?: string
  className?: string
}

const defaultItems: InteractiveMenuItem[] = [
  { label: '首页', icon: Home, to: '/' },
  { label: '策略', icon: Briefcase, to: '/strategy' },
  { label: '期间', icon: Calendar, to: '/period' },
  { label: '安全', icon: Shield, to: '/security' },
  { label: '设置', icon: Settings, to: '/settings' },
]

const defaultAccentColor = 'var(--component-active-color-default)'

const InteractiveMenu = ({ items, accentColor, className }: InteractiveMenuProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 8
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' 参数无效或缺失，已使用默认菜单。", items)
      return defaultItems
    }
    return items
  }, [items])

  const getActiveIndexFromPath = () => {
    if (location.pathname === '/' && finalItems.some((item) => item.to === '/')) {
      return finalItems.findIndex((item) => item.to === '/')
    }

    let index = finalItems.findIndex((item) => item.to === location.pathname)

    if (index === -1) {
      index = finalItems.findIndex(
        (item) => item.to && item.to !== '/' && location.pathname.startsWith(item.to),
      )
    }

    return index !== -1 ? index : 0
  }

  const [activeIndex, setActiveIndex] = useState(getActiveIndexFromPath)

  useEffect(() => {
    setActiveIndex(getActiveIndexFromPath())
  }, [location.pathname, finalItems])

  const textRefs = useRef<(HTMLElement | null)[]>([])
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex]
      const activeTextElement = textRefs.current[activeIndex]

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`)
      }
    }

    const timeoutId = setTimeout(setLineWidth, 50)
    window.addEventListener('resize', setLineWidth)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', setLineWidth)
    }
  }, [activeIndex, finalItems])

  const handleItemClick = (index: number) => {
    setActiveIndex(index)
    const item = finalItems[index]
    if (item.to) {
      navigate(item.to)
    }
  }

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor
    return { '--component-active-color': activeColor } as React.CSSProperties
  }, [accentColor])

  return (
    <nav className={`menu ${className || ''}`} role="navigation" style={navStyle}>
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex
        const IconComponent = item.icon

        return (
          <button
            key={`${item.label}-${index}`}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <div className="menu__icon">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu__text ${isActive ? 'active' : ''}`}
              ref={(element) => {
                textRefs.current[index] = element
              }}
            >
              {item.label}
            </strong>
          </button>
        )
      })}
    </nav>
  )
}

export { InteractiveMenu }
