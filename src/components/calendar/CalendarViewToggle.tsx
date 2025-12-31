import { Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarViewToggleProps {
  currentView: 'month' | 'week'
  onViewChange: (view: 'month' | 'week') => void
}

function CalendarViewToggle({ currentView, onViewChange }: CalendarViewToggleProps) {
  return (
    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-white/10">
      <button
        type="button"
        onClick={() => onViewChange('month')}
        className={cn(
          'flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          currentView === 'month'
            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        )}
        aria-label="月视图"
        title="月视图"
      >
        <Calendar className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onViewChange('week')}
        className={cn(
          'flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          currentView === 'week'
            ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
        )}
        aria-label="周视图"
        title="周视图"
      >
        <CalendarDays className="w-4 h-4" />
      </button>
    </div>
  )
}

export default CalendarViewToggle
