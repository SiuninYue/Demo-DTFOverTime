import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastDescriptor extends ToastOptions {
  id: string
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

const DEFAULT_DURATION = 4000

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastDescriptor[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...options, id }])

      const duration = options.duration ?? DEFAULT_DURATION
      if (duration > 0) {
        const timerId = window.setTimeout(() => dismissToast(id), duration)
        timers.current.set(id, timerId)
      }

      return id
    },
    [dismissToast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={['toast', `toast--${toast.variant ?? 'info'}`].join(' ')}>
            <div>
              <p className="toast__title">{toast.title}</p>
              {toast.description && <p className="toast__description">{toast.description}</p>}
            </div>
            <button type="button" className="ghost" onClick={() => dismissToast(toast.id)}>
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
