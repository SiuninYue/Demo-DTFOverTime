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

export type EmployeeUpsertInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
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
  scheduleData: (row.schedule_data as unknown as ScheduleData) ?? {},
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
  defaultStartTime: row.default_start_time ?? undefined,
  defaultEndTime: row.default_end_time ?? undefined,
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
  default_start_time: input.defaultStartTime ?? null,
  default_end_time: input.defaultEndTime ?? null,
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
  if (input.defaultStartTime !== undefined) payload.default_start_time = input.defaultStartTime ?? null
  if (input.defaultEndTime !== undefined) payload.default_end_time = input.defaultEndTime ?? null
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
    throw new Error(`保存排班失败：${error?.message ?? '未知错误'}`)
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
    throw new Error(`获取排班失败：${error.message}`)
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
    throw new Error('排班尚未创建，无法更新指定日期。')
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
    throw new Error(`获取员工资料失败：${error.message}`)
  }

  return data ? mapRowToEmployee(data) : null
}

export const createEmployee = async (input: EmployeeUpsertInput): Promise<Employee> => {
  const supabase = getSupabaseClient()

  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('需要登录后才能创建员工资料。')
  }

  // Use auth.uid() as employee id
  const payload = buildEmployeeInsert({ ...input, id: user.id })

  const { data, error } = await supabase.from('employees').insert(payload).select('*').single()

  if (error || !data) {
    throw new Error(`创建员工资料失败：${error?.message ?? '未知错误'}`)
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
    throw new Error('需要登录后才能更新员工资料。')
  }

  // Ensure user can only update their own record
  if (employeeId !== user.id) {
    throw new Error('无权限：不能更新其他用户的员工资料。')
  }

  const payload = buildEmployeeUpdate(input)

  if (!Object.keys(payload).length) {
    throw new Error('未提供需要更新的员工字段。')
  }

  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', employeeId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`更新员工资料失败：${error?.message ?? '未知错误'}`)
  }

  return mapRowToEmployee(data)
}
