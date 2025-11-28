import { z } from 'zod'
import { WorkScheduleType } from '@/types/employee'
import { ScheduleType } from '@/types/schedule'
import { DayType } from '@/types/timecard'

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const optionalString = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal('')])
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined
      }
      return value.trim() === '' ? undefined : value.trim()
    })

export const employeeSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  employeeId: optionalString(50),
  position: optionalString(50),
  baseSalary: z.coerce.number().min(0).max(100000),
  attendanceBonus: z.coerce.number().min(0).max(10000).default(0),
  workScheduleType: z.nativeEnum(WorkScheduleType),
  normalWorkHours: z.coerce.number().min(4).max(12).default(8),
  defaultRestHours: z.coerce.number().min(0).max(5).default(1),
  outletCode: optionalString(10),
  isWorkman: z.coerce.boolean(),
  payDay: z.coerce.number().int().min(1).max(31).default(7),
  startDate: optionalString(10).refine((value) => !value || DATE_REGEX.test(value), {
    message: 'startDate must use YYYY-MM-DD format',
  }),
})

export const scheduleDaySchema = z.object({
  date: z.string().regex(DATE_REGEX, 'Date must use YYYY-MM-DD format'),
  type: z.nativeEnum(ScheduleType),
  plannedStartTime: z
    .string()
    .regex(TIME_REGEX, 'Use 24h HH:mm format')
    .nullable()
    .optional(),
  plannedEndTime: z
    .string()
    .regex(TIME_REGEX, 'Use 24h HH:mm format')
    .nullable()
    .optional(),
  isStatutoryRestDay: z.boolean().default(false),
  notes: optionalString(280),
  isConfirmed: z.boolean().default(false),
  targetOutlet: optionalString(10),
  outletFullName: optionalString(80),
})

export const timeRecordSchema = z
  .object({
    date: z.string().regex(DATE_REGEX, 'Date must use YYYY-MM-DD format'),
    dayType: z.nativeEnum(DayType),
    actualStartTime: z
      .string()
      .regex(TIME_REGEX, 'Use 24h HH:mm format')
      .nullable()
      .optional(),
    actualEndTime: z
      .string()
      .regex(TIME_REGEX, 'Use 24h HH:mm format')
      .nullable()
      .optional(),
    restHours: z.coerce.number().min(0).max(5).default(1),
    isEmployerRequested: z.coerce.boolean().default(true),
    spansMidnight: z.coerce.boolean().default(false),
    notes: optionalString(280),
  })
  .refine(
    (value) =>
      (value.actualStartTime && value.actualEndTime) || (!value.actualStartTime && !value.actualEndTime),
    {
      message: 'actualStartTime and actualEndTime must both be provided or left blank',
      path: ['actualEndTime'],
    }
  )

export const mcRecordSchema = z.object({
  date: z.string().regex(DATE_REGEX, 'Date must use YYYY-MM-DD format'),
  days: z.coerce.number().int().min(1).max(14).default(1),
  certificateNumber: optionalString(50),
  reason: optionalString(200),
  isPaid: z.coerce.boolean().default(true),
})

export type EmployeeSettingsInput = z.infer<typeof employeeSettingsSchema>
export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>
export type TimeRecordInput = z.infer<typeof timeRecordSchema>
export type McRecordInput = z.infer<typeof mcRecordSchema>

export const parseEmployeeSettings = (data: unknown): EmployeeSettingsInput => employeeSettingsSchema.parse(data)
export const parseScheduleDay = (data: unknown): ScheduleDayInput => scheduleDaySchema.parse(data)
export const parseTimeRecord = (data: unknown): TimeRecordInput => timeRecordSchema.parse(data)
export const parseMcRecord = (data: unknown): McRecordInput => mcRecordSchema.parse(data)
