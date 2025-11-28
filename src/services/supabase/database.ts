import { getSupabaseClient } from '@/config/supabase'
import type { Database, Json } from '@/types/supabase'
import { CalculationMode, type Employee, WorkScheduleType } from '@/types/employee'
import type {
  Schedule,
  ScheduleData,
  DaySchedule,
  ScheduleRecognitionMethod,
} from '@/types/schedule'

type ScheduleRow = Database['public']['Tables']['schedules']['Row']
type EmployeeRow = Database['public']['Tables']['employees']['Row']
type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type EmployeeUpsertInput = Omit<Employee, 'createdAt' | 'updatedAt'> & { id?: string }
export type EmployeeUpdateInput = Partial<EmployeeUpsertInput>

const serializeScheduleData = (data: ScheduleData): Json =>
  JSON.parse(JSON.stringify(data)) as Json

const mapRowToSchedule = (row: ScheduleRow): Schedule => ({
  id: row.id,
  employeeId: row.employee_id,
  month: row.month,
  originalImageUrl: row.original_image_url ?? undefined,
  imageFileName: row.image_file_name ?? undefined,
  imageSize: row.image_size ?? undefined,
  recognitionAccuracy: row.recognition_accuracy ?? undefined,
  recognitionMethod: (row.recognition_method as ScheduleRecognitionMethod | null) ?? undefined,
  scheduleData: (row.schedule_data as ScheduleData) ?? {},
  importedAt: row.imported_at ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
})

const mapRowToEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  email: row.email,
  name: row.name,
  employeeId: row.employee_id ?? undefined,
  position: row.position ?? undefined,
  outletCode: row.outlet_code ?? undefined,
  baseSalary: row.base_salary,
  attendanceBonus: row.attendance_bonus ?? 0,
  workScheduleType: (row.work_schedule_type as WorkScheduleType) ?? WorkScheduleType.FIVE_DAY,
  normalWorkHours: row.normal_work_hours ?? 8,
  defaultRestHours: row.default_rest_hours ?? 1,
  isWorkman: row.is_workman ?? true,
  isPartIVApplicable: row.is_part_iv_applicable ?? true,
  payDay: row.pay_day ?? 7,
  startDate: row.start_date ?? undefined,
  calculationMode: (row.calculation_mode as CalculationMode) ?? CalculationMode.FULL_COMPLIANCE,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
})

const buildEmployeeInsert = (input: EmployeeUpsertInput): EmployeeInsert => ({
  id: input.id,
  email: input.email,
  name: input.name,
  employee_id: input.employeeId ?? null,
  position: input.position ?? null,
  outlet_code: input.outletCode ?? null,
  base_salary: input.baseSalary,
  attendance_bonus: input.attendanceBonus ?? 0,
  work_schedule_type: input.workScheduleType,
  normal_work_hours: input.normalWorkHours ?? 8,
  default_rest_hours: input.defaultRestHours ?? 1,
  is_workman: input.isWorkman,
  pay_day: input.payDay ?? 7,
  start_date: input.startDate ?? null,
  calculation_mode: input.calculationMode ?? CalculationMode.FULL_COMPLIANCE,
})

const buildEmployeeUpdate = (input: EmployeeUpdateInput): EmployeeUpdate => {
  const payload: EmployeeUpdate = {}

  if (input.email !== undefined) payload.email = input.email
  if (input.name !== undefined) payload.name = input.name
  if (input.employeeId !== undefined) payload.employee_id = input.employeeId ?? null
  if (input.position !== undefined) payload.position = input.position ?? null
  if (input.outletCode !== undefined) payload.outlet_code = input.outletCode ?? null
  if (input.baseSalary !== undefined) payload.base_salary = input.baseSalary
  if (input.attendanceBonus !== undefined) payload.attendance_bonus = input.attendanceBonus
  if (input.workScheduleType !== undefined) payload.work_schedule_type = input.workScheduleType
  if (input.normalWorkHours !== undefined) payload.normal_work_hours = input.normalWorkHours
  if (input.defaultRestHours !== undefined) payload.default_rest_hours = input.defaultRestHours
  if (input.isWorkman !== undefined) payload.is_workman = input.isWorkman
  if (input.payDay !== undefined) payload.pay_day = input.payDay
  if (input.startDate !== undefined) payload.start_date = input.startDate ?? null
  if (input.calculationMode !== undefined) payload.calculation_mode = input.calculationMode

  return payload
}

export interface UpsertScheduleParams {
  employeeId: string
  month: string
  scheduleData: ScheduleData
  imageUrl?: string | null
  imageFileName?: string | null
  imageSize?: number | null
  recognitionAccuracy?: number | null
  recognitionMethod?: ScheduleRecognitionMethod | null
  importedAt?: string | null
}

export const upsertSchedule = async (params: UpsertScheduleParams): Promise<Schedule> => {
  const supabase = getSupabaseClient()
  const payload = {
    employee_id: params.employeeId,
    month: params.month,
    schedule_data: serializeScheduleData(params.scheduleData),
    original_image_url: params.imageUrl ?? null,
    image_file_name: params.imageFileName ?? null,
    image_size: params.imageSize ?? null,
    recognition_accuracy: params.recognitionAccuracy ?? null,
    recognition_method: params.recognitionMethod ?? null,
    imported_at: params.importedAt ?? new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('schedules')
    .upsert(payload, { onConflict: 'employee_id,month' })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert schedule: ${error?.message ?? 'Unknown error'}`)
  }

  return mapRowToSchedule(data)
}

export const getScheduleByMonth = async (
  employeeId: string,
  month: string,
): Promise<Schedule | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('month', month)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch schedule: ${error.message}`)
  }

  return data ? mapRowToSchedule(data) : null
}

export interface UpdateScheduleDayParams {
  employeeId: string
  month: string
  date: string
  entry: DaySchedule
}

export const updateScheduleDay = async ({
  employeeId,
  month,
  date,
  entry,
}: UpdateScheduleDayParams): Promise<Schedule> => {
  const existing = await getScheduleByMonth(employeeId, month)

  if (!existing) {
    throw new Error('Cannot update day for a schedule that has not been created.')
  }

  const scheduleData: ScheduleData = {
    ...existing.scheduleData,
    [date]: entry,
  }

  return upsertSchedule({
    employeeId,
    month,
    scheduleData,
    imageUrl: existing.originalImageUrl ?? null,
    imageFileName: existing.imageFileName ?? null,
    imageSize: existing.imageSize ?? null,
    recognitionAccuracy: existing.recognitionAccuracy ?? null,
    recognitionMethod: existing.recognitionMethod ?? null,
    importedAt: existing.importedAt ?? null,
  })
}

export const getEmployee = async (employeeId: string): Promise<Employee | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch employee profile: ${error.message}`)
  }

  return data ? mapRowToEmployee(data) : null
}

export const createEmployee = async (input: EmployeeUpsertInput): Promise<Employee> => {
  const supabase = getSupabaseClient()

  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated to create employee record')
  }

  // Use auth.uid() as employee id
  const payload = buildEmployeeInsert({ ...input, id: user.id })

  const { data, error } = await supabase.from('employees').insert(payload).select('*').single()

  if (error || !data) {
    throw new Error(`Failed to create employee: ${error?.message ?? 'Unknown error'}`)
  }

  return mapRowToEmployee(data)
}

export const updateEmployee = async (
  employeeId: string,
  input: EmployeeUpdateInput,
): Promise<Employee> => {
  const supabase = getSupabaseClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be authenticated to update employee record')
  }

  // Ensure user can only update their own record
  if (employeeId !== user.id) {
    throw new Error('Unauthorized: Cannot update another user\'s employee record')
  }

  const payload = buildEmployeeUpdate(input)

  if (!Object.keys(payload).length) {
    throw new Error('No employee fields provided for update.')
  }

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', employeeId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to update employee: ${error?.message ?? 'Unknown error'}`)
  }

  return mapRowToEmployee(data)
}
