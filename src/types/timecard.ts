export enum DayType {
  NORMAL_WORK_DAY = 'NORMAL_WORK_DAY',
  REST_DAY = 'REST_DAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  ANNUAL_LEAVE = 'ANNUAL_LEAVE',
  MEDICAL_LEAVE = 'MEDICAL_LEAVE',
  OFF_DAY = 'OFF_DAY',
}

export interface TimeRecord {
  id?: string
  employeeId?: string
  date: string
  dayType: DayType
  isStatutoryRestDay?: boolean
  actualStartTime?: string | null
  actualEndTime?: string | null
  restHours: number
  isEmployerRequested?: boolean
  spansMidnight?: boolean
  hoursWorked?: number | null
  basePay?: number | null
  overtimePay?: number | null
  notes?: string | null
  isModified?: boolean
  createdAt?: string
  updatedAt?: string
}

export type TimeRecordInput = Omit<TimeRecord, 'id' | 'createdAt' | 'updatedAt'>
