import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';

type IconComponentType = React.ElementType<{ className?: string }>;
export interface InteractiveMenuItem {
    label: string;
    icon: IconComponentType;
    to?: string; // Added route path
}

export interface InteractiveMenuProps {
    items?: InteractiveMenuItem[];
    accentColor?: string;
    className?: string;
}

const defaultItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home, to: '/' },
    { label: 'strategy', icon: Briefcase, to: '/strategy' },
    { label: 'period', icon: Calendar, to: '/period' },
    { label: 'security', icon: Shield, to: '/security' },
    { label: 'settings', icon: Settings, to: '/settings' },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor, className }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const finalItems = useMemo(() => {
        const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 8;
        if (!isValid) {
            console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
            return defaultItems;
        }
        return items;
    }, [items]);

    // Derive active index from current path
    const getActiveIndexFromPath = () => {
        // If we are exactly at root, match root.
        if (location.pathname === '/' && finalItems.some(i => i.to === '/')) {
            return finalItems.findIndex(i => i.to === '/');
        }

        // Otherwise match the longest matching prefix (to handle nested routes if any, though here they are simple)
        // Or just simple matching. 
        // Prioritize exact match first.
        let index = finalItems.findIndex(item => item.to === location.pathname);

        if (index === -1) {
            // Try starting with (for sub-routes like /salary/123)
            // Ensure we don't match '/' against '/salary' just because it starts with '/'
            index = finalItems.findIndex(item => item.to && item.to !== '/' && location.pathname.startsWith(item.to));
        }

        return index !== -1 ? index : 0;
    };

    const [activeIndex, setActiveIndex] = useState(getActiveIndexFromPath);

    // Sync state with location changes
    useEffect(() => {
        setActiveIndex(getActiveIndexFromPath());
    }, [location.pathname, finalItems]);

    const textRefs = useRef<(HTMLElement | null)[]>([]);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const setLineWidth = () => {
            const activeItemElement = itemRefs.current[activeIndex];
            const activeTextElement = textRefs.current[activeIndex];

            if (activeItemElement && activeTextElement) {
                const textWidth = activeTextElement.offsetWidth;
                activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
            }
        };

        const timeoutId = setTimeout(setLineWidth, 50);
        window.addEventListener('resize', setLineWidth);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', setLineWidth);
        };
    }, [activeIndex, finalItems]);

    const handleItemClick = (index: number) => {
        setActiveIndex(index);
        const item = finalItems[index];
        if (item.to) {
            navigate(item.to);
        }
    };

    const navStyle = useMemo(() => {
        const activeColor = accentColor || defaultAccentColor;
        return { '--component-active-color': activeColor } as React.CSSProperties;
    }, [accentColor]);

    return (
        <nav
            className={`menu ${className || ''}`}
            role="navigation"
            style={navStyle}
        >
            {finalItems.map((item, index) => {
                const isActive = index === activeIndex;
                const isTextActive = isActive;
                const IconComponent = item.icon;

                return (
                    <button
                        key={item.label}
                        className={`menu__item ${isActive ? 'active' : ''}`}
                        onClick={() => handleItemClick(index)}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        style={{ '--lineWidth': '0px' } as React.CSSProperties}
                    >
                        <div className="menu__icon">
                            <IconComponent className="icon" />
                        </div>
                        <strong
                            className={`menu__text ${isTextActive ? 'active' : ''}`}
                            ref={(el) => { textRefs.current[index] = el; }}
                        >
                            {item.label}
                        </strong>
                    </button>
                );
            })}
        </nav>
    );
};

export { InteractiveMenu }
