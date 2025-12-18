import { MouseEvent, TouchEvent, useState } from 'react'
import type { DaySchedule, ScheduleType } from '@/types/schedule'
import type { TimeRecord, DayType } from '@/types/timecard'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeColors: Record<ScheduleType, string> = {
  work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  rest: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  off: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  overtime_on_off_day: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  public_holiday: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  training: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  support_incoming: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  support_outgoing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  co: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const typeShortLabels: Record<ScheduleType, string> = {
  work: 'WK',
  rest: 'RD',
  off: 'OFF',
  overtime_on_off_day: 'OT',
  leave: 'LV',
  public_holiday: 'PH',
  training: 'TR',
  support_incoming: 'SI',
  support_outgoing: 'SO',
  co: 'CO',
  unknown: '?',
}

export type QuickAction = 'edit' | 'timecard' | 'history' | 'copy' | 'paste'

interface DayCellProps {
  date: string
  schedule?: DaySchedule
  timeRecord?: TimeRecord
  isCurrentMonth: boolean
  isToday?: boolean
  onSelect?: (date: string) => void
  onQuickAction?: (date: string, action: QuickAction) => void
}

const formatTimeShort = (timeStr?: string | null) => {
  if (!timeStr) return ''
  // "09:00:00" -> "09:00"
  return timeStr.slice(0, 5)
}

function DayCell({
  date,
  schedule,
  timeRecord,
  isCurrentMonth,
  isToday = false,
  onSelect,
  onQuickAction,
}: DayCellProps) {
  /* Removed handleAction and showMenu state as part of UI cleanup */
  const dayNumber = date.split('-')[2]


  // Glassmorphism Visual State
  const containerClasses = cn(
    "relative flex flex-col h-full w-full border-[0.5px] border-white/20 dark:border-white/5 transition-all duration-200 select-none group backdrop-blur-[2px]",
    isCurrentMonth
      ? "bg-white/40 dark:bg-neutral-900/40 hover:bg-white/60 dark:hover:bg-neutral-800/60"
      : "bg-neutral-100/30 dark:bg-neutral-900/10 text-neutral-400/50",
    isToday && "ring-2 ring-primary-500/50 dark:ring-primary-400/50 z-10"
  )

  return (
    <div
      className={containerClasses}
      onClick={(e) => {
        e.stopPropagation()
        if (isCurrentMonth) onSelect?.(date)
      }}
    >
      {/* Header: Date & Menu */}
      <div className="flex items-center justify-between p-1.5 pl-2 pb-0">
        <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-400'}`}>
          {dayNumber}
        </span>


      </div>

      {/* Body: simplified content */}
      <div className="flex-1 flex flex-col justify-start p-1.5 gap-1 min-h-[4rem] overflow-hidden">
        {timeRecord ? (
          // Recorded Timecard State
          <div className={`text-xs p-1 rounded font-medium truncate ${schedule ? typeColors[schedule.type] : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
            <div className="flex items-center gap-1">
              <span className="font-bold">✓</span>
              <span className="truncate">{timeRecord.dayType === 'NORMAL_WORK_DAY' ? 'Worked' : 'Recorded'}</span>
            </div>
            <div className="text-[10px] opacity-80 mt-0.5">
              {formatTimeShort(timeRecord.actualStartTime)}
              {timeRecord.actualEndTime ? ` - ${formatTimeShort(timeRecord.actualEndTime)}` : ''}
            </div>
          </div>
        ) : schedule ? (
          // Schedule State
          <div className={`text-xs p-1 rounded font-medium truncate ${typeColors[schedule.type]}`}>
            <div className="truncate font-semibold">{typeShortLabels[schedule.type] || schedule.type}</div>
            {(schedule.plannedStartTime || schedule.plannedEndTime) && (
              <div className="text-[10px] opacity-80 mt-0.5 whitespace-nowrap">
                {formatTimeShort(schedule.plannedStartTime)}
                {schedule.plannedEndTime ? `-${formatTimeShort(schedule.plannedEndTime)}` : ''}
              </div>
            )}
          </div>
        ) : isCurrentMonth ? (
          // Empty State - Minimalist "+"
          <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
          </div>
        ) : null}
      </div>


    </div>
  )
}



export default DayCell
