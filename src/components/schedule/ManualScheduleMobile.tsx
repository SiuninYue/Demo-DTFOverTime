import { useState, useMemo, useEffect, useRef } from 'react'
import { Copy, ClipboardPaste, X, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { ScheduleType, type DaySchedule, type ScheduleData } from '@/types/schedule'
import type { TimeRecord } from '@/types/timecard'
import { isPublicHoliday, getPublicHolidayName } from '@/utils/holidays'
import { useUserStore } from '@/store/userStore'
import { getDaysInMonth } from '@/utils/dateUtils'
import { cn } from '@/lib/utils'

// Types
const scheduleOptions = [
    { label: '工作', value: ScheduleType.WORK, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { label: '休息', value: ScheduleType.REST, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { label: '调休', value: ScheduleType.OFF, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { label: '公假', value: ScheduleType.PUBLIC_HOLIDAY, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    { label: '年假', value: ScheduleType.LEAVE, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
]

const buildDefaultDay = (
    defaultStartTime?: string,
    defaultEndTime?: string,
): DaySchedule => ({
    type: ScheduleType.WORK,
    plannedStartTime: defaultStartTime || '10:00',
    plannedEndTime: defaultEndTime || '19:00',
    isStatutoryRestDay: false,
    notes: '',
    isConfirmed: false,
})

interface ManualScheduleMobileProps {
    month: string
    schedule: ScheduleData
    onChange: (data: ScheduleData) => void
    disabled?: boolean
    timeRecords?: Record<string, TimeRecord>
    isSaving?: boolean
    onSubmit?: () => void
}

function ManualScheduleMobile({
    month,
    schedule,
    onChange,
    disabled,
    timeRecords,
    isSaving,
    onSubmit
}: ManualScheduleMobileProps) {
    const userProfile = useUserStore((state) => state.profile)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [clipboard, setClipboard] = useState<DaySchedule | null>(null)

    // Generate date list
    const dateList = useMemo(() => {
        const [year, monthPart] = month.split('-').map(Number);
        const totalDays = getDaysInMonth(year || new Date().getFullYear(), monthPart || 1);
        const dates: string[] = [];
        for (let day = 1; day <= totalDays; day++) {
            dates.push(`${month}-${String(day).padStart(2, '0')}`);
        }
        return dates;
    }, [month]);

    const handleUpdateDay = (date: string, updates: Partial<DaySchedule>) => {
        const current = schedule[date] ?? buildDefaultDay(userProfile?.defaultStartTime, userProfile?.defaultEndTime)
        const updated = { ...current, ...updates }

        if (updated.type !== ScheduleType.WORK && updated.type !== ScheduleType.OFF) {
            updated.plannedStartTime = null
            updated.plannedEndTime = null
        }

        onChange({
            ...schedule,
            [date]: updated
        })
    }

    const handleCopy = (date: string) => {
        const entry = schedule[date] ?? buildDefaultDay(userProfile?.defaultStartTime, userProfile?.defaultEndTime)
        setClipboard(entry)
    }

    const handlePaste = (date: string) => {
        if (!clipboard) return
        handleUpdateDay(date, { ...clipboard })
    }

    const currentEntry = selectedDate ? (schedule[selectedDate] ?? buildDefaultDay(userProfile?.defaultStartTime, userProfile?.defaultEndTime)) : null
    const isSelectedPH = selectedDate ? isPublicHoliday(selectedDate) : false

    return (
        <div className="flex flex-col min-h-[50vh] pb-24 relative">
            <div className="space-y-3 px-1">
                {dateList.map((date) => {
                    const entry = schedule[date] ?? buildDefaultDay(userProfile?.defaultStartTime, userProfile?.defaultEndTime)
                    const dateObj = new Date(date)
                    const dayNum = dateObj.getDate()
                    const weekDay = dateObj.getDay()
                    const weekLabel = ['日', '一', '二', '三', '四', '五', '六'][weekDay]
                    const isWeekend = weekDay === 0 || weekDay === 6
                    const isPH = isPublicHoliday(date)
                    const phName = isPH ? getPublicHolidayName(date) : null

                    const typeOption = scheduleOptions.find(opt => opt.value === entry.type)
                    const isConfirmed = timeRecords?.[date]

                    return (
                        <div
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50 shadow-sm active:scale-[0.98] transition-all",
                                "ios-touch-target",
                                isPH && "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20",
                                selectedDate === date && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-black"
                            )}
                        >
                            {/* Left: Date */}
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 mr-4 shrink-0">
                                <span className={cn("text-xs font-medium", isWeekend || isPH ? "text-red-500" : "text-neutral-500")}>
                                    周{weekLabel}
                                </span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white leading-none mt-0.5">
                                    {dayNum}
                                </span>
                            </div>

                            {/* Center: Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("px-2.5 py-0.5 text-xs font-bold rounded-md", typeOption?.color)}>
                                        {typeOption?.label}
                                    </span>
                                    {entry.isStatutoryRestDay && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                            法定
                                        </span>
                                    )}
                                    {isConfirmed && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                                            <Check className="w-3 h-3" /> 已确认
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                    {entry.type === ScheduleType.WORK || entry.type === ScheduleType.OFF ? (
                                        <span>
                                            {entry.plannedStartTime?.slice(0, 5)} - {entry.plannedEndTime?.slice(0, 5)}
                                        </span>
                                    ) : (
                                        <span>{isPH ? (phName || '公共假期') : (typeOption?.label)}</span>
                                    )}
                                    {entry.notes && <span className="ml-2 text-neutral-400 border-l pl-2 border-neutral-300 dark:border-neutral-700">{entry.notes}</span>}
                                </div>
                            </div>

                            {/* Right: Chevron */}
                            <div className="ml-2 text-neutral-300 dark:text-neutral-600">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Edit Drawer */}
            <div className={cn(
                "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity",
                selectedDate ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )} onClick={() => setSelectedDate(null)} />

            <div className={cn(
                "fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-neutral-900 rounded-t-[32px] shadow-2xl transition-transform duration-300 ease-out border-t border-neutral-100 dark:border-neutral-800",
                selectedDate ? "translate-y-0" : "translate-y-full"
            )}>
                {selectedDate && currentEntry && (
                    <div className="p-6 pb-safe safe-area-bottom max-h-[80vh] overflow-y-auto w-full">
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    {selectedDate}
                                </h3>
                                <p className="text-neutral-500 font-medium mt-1">
                                    {new Date(selectedDate).toLocaleDateString('zh-CN', { weekday: 'long' })}
                                    {isSelectedPH && <span className="ml-2 text-red-500">{getPublicHolidayName(selectedDate)}</span>}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Type Selection */}
                            <div className="grid grid-cols-5 gap-2">
                                {scheduleOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleUpdateDay(selectedDate, { type: opt.value as ScheduleType })}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-xl border border-transparent transition-all",
                                            currentEntry.type === opt.value
                                                ? cn("bg-white shadow-lg border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 ring-2 ring-indigo-500", opt.color)
                                                : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500"
                                        )}
                                    >
                                        <span className="text-xs font-bold leading-tight py-2">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Statutory Checkbox */}
                            {(currentEntry.type === ScheduleType.REST || currentEntry.type === ScheduleType.OFF) && (
                                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                    <label htmlFor="statutory-mobile" className="font-medium">法定休息</label>
                                    <input
                                        type="checkbox"
                                        id="statutory-mobile"
                                        checked={currentEntry.isStatutoryRestDay}
                                        onChange={(e) => handleUpdateDay(selectedDate, { isStatutoryRestDay: e.target.checked })}
                                        className="w-6 h-6 accent-indigo-600 rounded-lg"
                                    />
                                </div>
                            )}

                            {/* Time Inputs */}
                            {(currentEntry.type === ScheduleType.WORK || currentEntry.type === ScheduleType.OFF || currentEntry.isStatutoryRestDay) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-500">开始时间</label>
                                        <input
                                            type="time"
                                            value={currentEntry.plannedStartTime ?? ''}
                                            onChange={(e) => handleUpdateDay(selectedDate, { plannedStartTime: e.target.value })}
                                            className="w-full text-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-lg font-bold outline-none ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-500">结束时间</label>
                                        <input
                                            type="time"
                                            value={currentEntry.plannedEndTime ?? ''}
                                            onChange={(e) => handleUpdateDay(selectedDate, { plannedEndTime: e.target.value })}
                                            className="w-full text-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-lg font-bold outline-none ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-500">备注</label>
                                <input
                                    type="text"
                                    value={currentEntry.notes ?? ''}
                                    onChange={(e) => handleUpdateDay(selectedDate, { notes: e.target.value })}
                                    placeholder="添加备注..."
                                    className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 outline-none ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => handleCopy(selectedDate)} className="flex-1 py-3 items-center justify-center flex gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-medium text-neutral-700 dark:text-neutral-300">
                                    <Copy className="w-5 h-5" /> 复制
                                </button>
                                <button
                                    onClick={() => handlePaste(selectedDate)}
                                    disabled={!clipboard}
                                    className="flex-1 py-3 items-center justify-center flex gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 disabled:opacity-50"
                                >
                                    <ClipboardPaste className="w-5 h-5" /> 粘贴
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedDate(null)}
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all"
                            >
                                完成
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            {!selectedDate && onSubmit && (
                <div className="fixed bottom-24 right-6 z-40">
                    <button
                        onClick={onSubmit}
                        disabled={isSaving || disabled}
                        className="group flex items-center gap-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full px-6 py-4 font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <span>{isSaving ? '保存中...' : '保存排班'}</span>
                        {!isSaving && <div className="bg-white/20 dark:bg-black/10 rounded-full p-1"><Check className="w-4 h-4" /></div>}
                    </button>
                </div>
            )}
        </div>
    )
}

export default ManualScheduleMobile
