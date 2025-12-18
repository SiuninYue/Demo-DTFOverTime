import React, { useState, type ReactNode } from 'react'

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
  className?: string
}

const PULL_THRESHOLD = 80
const MAX_PULL = 140

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const [startY, setStartY] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const canStartPull = () => {
    if (disabled || isRefreshing || typeof window === 'undefined') return false
    return window.scrollY <= 0
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    if (!canStartPull()) return
    setStartY(event.touches[0].clientY)
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    if (disabled || isRefreshing || startY === null) return
    const currentY = event.touches[0].clientY
    const distance = currentY - startY

    if (distance > 0 && canStartPull()) {
      const dampened = Math.min(distance * 0.45, MAX_PULL)
      setOffset(dampened)
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || startY === null) return

    if (offset > PULL_THRESHOLD) {
      setIsRefreshing(true)
      setOffset(PULL_THRESHOLD)

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(50)
        }
        await onRefresh()
      } finally {
        setTimeout(() => {
          setIsRefreshing(false)
          setOffset(0)
        }, 450)
      }
    } else {
      setOffset(0)
    }

    setStartY(null)
  }

  return (
    <div
      className={['relative min-h-[calc(100vh-4rem)]', className].filter(Boolean).join(' ')}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center" style={{ height: MAX_PULL }}>
        <div
          className="mt-3 flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm backdrop-blur transition-all duration-300"
          style={{
            transform: `translateY(${offset * 0.6}px)`,
            opacity: Math.min(1, offset / PULL_THRESHOLD),
          }}
        >
          {isRefreshing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <span>更新中…</span>
            </>
          ) : (
            <>
              <span
                className="text-lg transition-transform duration-200"
                style={{ transform: `rotate(${offset * 2.2}deg)` }}
              >
                ⬇
              </span>
              <span>{offset > PULL_THRESHOLD ? '松手刷新' : '下拉刷新'}</span>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition:
            isRefreshing || startY === null
              ? 'transform 0.25s cubic-bezier(0.25, 0.8, 0.4, 1)'
              : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh
