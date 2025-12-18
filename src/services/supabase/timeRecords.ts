import { getSupabaseClient } from '@/config/supabase'
import type { Database } from '@/types/supabase'
import { DayType, type TimeRecord, type TimeRecordInput } from '@/types/timecard'

type TimeRecordRow = Database['public']['Tables']['time_records']['Row']
type TimeRecordInsert = Database['public']['Tables']['time_records']['Insert']
type TimeRecordUpdate = Database['public']['Tables']['time_records']['Update']

const describeRlsBlock = (action: string, message: string) => {
  const lower = message.toLowerCase()
  const isRls = lower.includes('row-level security') || lower.includes('rls')
  return isRls
    ? `${action} 因行级安全（RLS）被拦截。请确保已登录用户仅能对 employee_id 匹配 auth.uid() 的记录进行写入/更新。`
    : `${action}：${message}`
}

const mapRowToRecord = (row: TimeRecordRow): TimeRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.date,
  dayType: row.day_type as TimeRecord['dayType'],
  actualStartTime: row.actual_start_time,
  actualEndTime: row.actual_end_time,
  restHours: row.rest_hours ?? 0,
  isEmployerRequested: row.is_employer_requested ?? undefined,
  spansMidnight: row.spans_midnight ?? undefined,
  hoursWorked: row.hours_worked ?? undefined,
  basePay: row.base_pay ?? undefined,
  overtimePay: row.overtime_pay ?? undefined,
  notes: row.notes ?? undefined,
  isModified: row.is_modified ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
})

export const getMonthlyRecords = async (employeeId: string, month: string): Promise<TimeRecord[]> => {
  const supabase = getSupabaseClient()
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const startDate = `${month}-01`
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('time_records')
    .select(
      'id, employee_id, date, day_type, actual_start_time, actual_end_time, rest_hours, is_employer_requested, spans_midnight, hours_worked, base_pay, overtime_pay, notes, is_modified, created_at, updated_at',
    )
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`加载打卡记录失败：${error.message}`)
  }

  return (data ?? []).map(mapRowToRecord)
}

export const getTimeRecordByDate = async (
  employeeId: string,
  date: string,
): Promise<TimeRecord | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('time_records')
    .select(
      'id, employee_id, date, day_type, actual_start_time, actual_end_time, rest_hours, is_employer_requested, spans_midnight, hours_worked, base_pay, overtime_pay, notes, is_modified, created_at, updated_at',
    )
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    throw new Error(`获取 ${date} 的打卡记录失败：${error.message}`)
  }

  return data ? mapRowToRecord(data) : null
}

interface CreateTimeRecordInput extends TimeRecordInput {
  employeeId: string
}

const buildInsertPayload = (input: CreateTimeRecordInput): TimeRecordInsert => ({
  employee_id: input.employeeId,
  date: input.date,
  day_type: input.dayType,
  actual_start_time: input.actualStartTime ?? null,
  actual_end_time: input.actualEndTime ?? null,
  rest_hours: input.restHours,
  is_employer_requested: input.isEmployerRequested ?? null,
  spans_midnight: input.spansMidnight ?? null,
  notes: input.notes ?? null,
  is_modified: input.isModified ?? null,
  hours_worked: input.hoursWorked ?? null,
  base_pay: input.basePay ?? null,
  overtime_pay: input.overtimePay ?? null,
})

export const createTimeRecord = async (input: CreateTimeRecordInput): Promise<TimeRecord> => {
  const supabase = getSupabaseClient()
  const payload = buildInsertPayload(input)

  const { data, error } = await supabase
    .from('time_records')
    .insert(payload)
    .select(
      'id, employee_id, date, day_type, actual_start_time, actual_end_time, rest_hours, is_employer_requested, spans_midnight, hours_worked, base_pay, overtime_pay, notes, is_modified, created_at, updated_at',
    )
    .single()

  if (error || !data) {
    const detail = error?.message ?? '未知错误'
    throw new Error(describeRlsBlock('创建打卡记录失败', detail))
  }

  return mapRowToRecord(data)
}

export const updateTimeRecord = async (
  id: string,
  input: Partial<TimeRecordInput>,
): Promise<TimeRecord> => {
  const supabase = getSupabaseClient()
  const payload: TimeRecordUpdate = {
    actual_start_time: input.actualStartTime ?? null,
    actual_end_time: input.actualEndTime ?? null,
    rest_hours: input.restHours,
    day_type: input.dayType,
    is_employer_requested: input.isEmployerRequested ?? null,
    spans_midnight: input.spansMidnight ?? null,
    notes: input.notes ?? null,
    is_modified: input.isModified ?? null,
    hours_worked: input.hoursWorked ?? null,
    base_pay: input.basePay ?? null,
    overtime_pay: input.overtimePay ?? null,
  }

  const { data, error } = await supabase
    .from('time_records')
    .update(payload)
    .eq('id', id)
    .select(
      'id, employee_id, date, day_type, actual_start_time, actual_end_time, rest_hours, is_employer_requested, spans_midnight, hours_worked, base_pay, overtime_pay, notes, is_modified, created_at, updated_at',
    )
    .single()

  if (error || !data) {
    const detail = error?.message ?? '未知错误'
    throw new Error(describeRlsBlock('更新打卡记录失败', detail))
  }

  return mapRowToRecord(data)
}

const UNPAID_MC_TAG = '[UNPAID_MC]'

const mergeUnpaidNote = (existing: string | null | undefined, isPaid: boolean) => {
  const current = existing ?? ''
  if (isPaid) {
    return current.replace(UNPAID_MC_TAG, '').trim() || null
  }
  return current.includes(UNPAID_MC_TAG)
    ? current
    : [UNPAID_MC_TAG, current].filter(Boolean).join(' ').trim()
}

export const upsertMcDates = async ({
  employeeId,
  entries,
}: {
  employeeId: string
  entries: Array<{ date: string; isPaid: boolean }>
}): Promise<void> => {
  const unique = Array.from(new Map(entries.map((e) => [e.date, e.isPaid])).entries()).map(
    ([date, isPaid]) => ({ date, isPaid }),
  )

  for (const { date, isPaid } of unique) {
    const existing = await getTimeRecordByDate(employeeId, date)
    const mergedNotes = mergeUnpaidNote(existing?.notes, isPaid)

    if (existing) {
      if (
        existing.dayType === DayType.REST_DAY ||
        existing.dayType === DayType.OFF_DAY ||
        existing.dayType === DayType.PUBLIC_HOLIDAY
      ) {
        continue
      }
      await updateTimeRecord(existing.id as string, {
        dayType: DayType.MEDICAL_LEAVE,
        restHours: existing.restHours ?? 0,
        actualStartTime: null,
        actualEndTime: null,
        isEmployerRequested: false,
        spansMidnight: false,
        notes: mergedNotes,
      })
    } else {
      await createTimeRecord({
        employeeId,
        date,
        dayType: DayType.MEDICAL_LEAVE,
        restHours: 0,
        actualStartTime: null,
        actualEndTime: null,
        isEmployerRequested: false,
        spansMidnight: false,
        notes: mergedNotes,
      })
    }
  }
}

export const deleteTimeRecord = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('time_records').delete().eq('id', id)
  if (error) {
    throw new Error(`删除打卡记录失败：${error.message}`)
  }
}
