import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SmartTimeInputProps {
    label: string
    value: string | null | undefined
    onChange: (value: string | null) => void
    helperText?: string
    disabled?: boolean
    className?: string
}

/**
 * Parses rough user input into HH:mm format
 * Examples: 
 * "9" -> "09:00"
 * "930" -> "09:30"
 * "14" -> "14:00"
 * "2pm" -> "14:00"
 */
const parseTime = (input: string): string | null => {
    const clean = input.toLowerCase().replace(/[^a-z0-9:]/g, '')
    if (!clean) return null

    let hours = 0
    let minutes = 0
    let isPm = clean.includes('p')
    let isAm = clean.includes('a')

    // Extract numbers
    const nums = clean.replace(/[^\d]/g, '')
    if (!nums) return null

    const val = parseInt(nums, 10)

    // heuristics
    if (clean.includes(':')) {
        const parts = clean.split(':')
        hours = parseInt(parts[0], 10)
        minutes = parseInt(parts[1]?.replace(/[^\d]/g, '') || '0', 10)
    } else {
        // raw numbers
        if (nums.length <= 2) {
            // "9" or "14" -> 9:00 or 14:00
            hours = val
        } else if (nums.length === 3) {
            // "930" -> 9:30
            hours = Math.floor(val / 100)
            minutes = val % 100
        } else if (nums.length === 4) {
            // "1430" -> 14:30
            hours = Math.floor(val / 100)
            minutes = val % 100
        }
    }

    // Adjust for AM/PM
    if (isPm && hours < 12) hours += 12
    if (isAm && hours === 12) hours = 0

    // Clamping
    hours = Math.max(0, Math.min(23, hours))
    minutes = Math.max(0, Math.min(59, minutes))

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export default function SmartTimeInput({
    label,
    value,
    onChange,
    helperText,
    disabled = false,
    className
}: SmartTimeInputProps) {
    const [inputValue, setInputValue] = useState(value ?? '')
    const [error, setError] = useState(false)

    // Sync internal state when prop changes externally
    useEffect(() => {
        setInputValue(value ?? '')
    }, [value])

    const handleBlur = () => {
        if (!inputValue.trim()) {
            onChange(null)
            setError(false)
            return
        }

        const parsed = parseTime(inputValue)
        if (parsed) {
            setInputValue(parsed)
            onChange(parsed)
            setError(false)
        } else {
            setError(true)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur()
        }
    }

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        setError(false)
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="e.g. 09:00 or 930"
                    className={cn(
                        "w-full px-3 py-2 text-base rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm transition-all outline-none",
                        "focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        error ? "border-red-500 focus:border-red-500" : "border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800/50"
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-neutral-400">
                    HH:MM
                </div>
            </div>
            {helperText && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</span>
            )}
        </div>
    )
}
