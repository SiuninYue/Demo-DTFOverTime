export enum ScheduleType {
  WORK = 'work',
  REST = 'rest',
  OFF = 'off',
  OVERTIME_ON_OFF_DAY = 'overtime_on_off_day',
  LEAVE = 'leave',
  PUBLIC_HOLIDAY = 'public_holiday',
  TRAINING = 'training',
  SUPPORT_INCOMING = 'support_incoming',
  SUPPORT_OUTGOING = 'support_outgoing',
  COMP_OFF = 'co',
  UNKNOWN = 'unknown',
}

export type ScheduleRecognitionMethod = 'GPT4_VISION' | 'TESSERACT' | 'MANUAL'

export interface DaySchedule {
  type: ScheduleType
  plannedStartTime: string | null
  plannedEndTime: string | null
  isStatutoryRestDay: boolean
  notes?: string | null
  isConfirmed: boolean
  targetOutlet?: string | null
  outletFullName?: string | null
}

export type ScheduleData = Record<string, DaySchedule>

export interface Schedule {
  id: string
  employeeId: string
  month: string
  originalImageUrl?: string | null
  imageFileName?: string | null
  imageSize?: number | null
  recognitionAccuracy?: number | null
  recognitionMethod?: ScheduleRecognitionMethod
  scheduleData: ScheduleData
  importedAt?: string
  createdAt?: string
  updatedAt?: string
}
