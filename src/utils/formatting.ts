export interface CurrencyFormatOptions {
  locale?: string
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface TimeFormatOptions {
  format?: '12h' | '24h'
  placeholder?: string
}

export interface DateFormatOptions {
  locale?: string
  format?: 'short' | 'medium' | 'long' | 'full'
  includeWeekday?: boolean
  includeTime?: boolean
  placeholder?: string
}

const pad = (value: number): string => value.toString().padStart(2, '0')

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number(value.toString().replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

export const formatCurrency = (
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string => {
  const amount = toNumber(value)
  if (amount === null) {
    return '—'
  }

  const { locale = 'zh-SG', currency = 'SGD' } = options
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  })

  return formatter.format(amount)
}

const parseTime = (value: string | Date): { hours: number; minutes: number } => {
  if (value instanceof Date) {
    return { hours: value.getHours(), minutes: value.getMinutes() }
  }

  const [hoursPart, minutesPart] = value.split(':')
  const hours = Number.parseInt(hoursPart ?? '0', 10)
  const minutes = Number.parseInt(minutesPart ?? '0', 10)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new Error(`时间格式无效：${value}`)
  }

  return { hours, minutes }
}

export const formatTime = (
  value: string | Date | null | undefined,
  options: TimeFormatOptions = {}
): string => {
  if (!value) {
    return options.placeholder ?? '--:--'
  }

  const { hours, minutes } = parseTime(value)
  const format = options.format ?? '24h'

  if (format === '12h') {
    const suffix = hours >= 12 ? 'PM' : 'AM'
    const normalizedHours = hours % 12 || 12
    return `${normalizedHours}:${pad(minutes)} ${suffix}`
  }

  return `${pad(hours)}:${pad(minutes)}`
}

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value))

export const formatDate = (
  value: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string => {
  if (!value) {
    return options.placeholder ?? '--'
  }

  const date = toDate(value)
  if (Number.isNaN(date.valueOf())) {
    return options.placeholder ?? '--'
  }

  const { locale = 'zh-SG', format = 'medium', includeWeekday = false, includeTime = false } = options
  const intlOptions: Intl.DateTimeFormatOptions = {
    dateStyle: format,
  }

  if (includeWeekday) {
    intlOptions.weekday = format === 'short' ? 'short' : 'long'
  }

  if (includeTime) {
    intlOptions.timeStyle = 'short'
  }

  return new Intl.DateTimeFormat(locale, intlOptions).format(date)
}
