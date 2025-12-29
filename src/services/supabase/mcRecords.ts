import { getSupabaseClient } from '@/config/supabase'
import type { Database } from '@/types/supabase'

export interface MCRecord {
  id: string
  employeeId: string
  date: string
  days: number
  certificateNumber?: string | null
  reason?: string | null
  isPaid: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type MCRecordRow = Database['public']['Tables']['mc_records']['Row']
type MCRecordInsert = Database['public']['Tables']['mc_records']['Insert']
type MCRecordUpdate = Database['public']['Tables']['mc_records']['Update']

const mapRowToRecord = (row: MCRecordRow): MCRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.date,
  days: row.days ?? 0,
  certificateNumber: row.certificate_number,
  reason: row.reason,
  isPaid: row.is_paid ?? true,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
})

const buildMonthRange = (month: string): { start: string; end: string } => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error(`月份格式无效：${month}，应为 YYYY-MM。`)
  }
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const start = `${month}-01`
  const end = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10)
  return { start, end }
}

export const getMonthlyMcRecords = async (
  employeeId: string,
  month: string,
): Promise<MCRecord[]> => {
  const supabase = getSupabaseClient()
  const { start, end } = buildMonthRange(month)

  const { data, error } = await supabase
    .from('mc_records')
    .select('id, employee_id, date, days, certificate_number, reason, is_paid, created_at, updated_at')
    .eq('employee_id', employeeId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`加载病假记录失败：${error.message}`)
  }

  return (data ?? []).map(mapRowToRecord)
}

export const getMonthlyMcDays = async (employeeId: string, month: string): Promise<number> => {
  const records = await getMonthlyMcRecords(employeeId, month)
  return records.reduce((total, record) => total + Math.max(0, record.days), 0)
}

export interface CreateMcRecordInput {
  employeeId: string
  date: string
  days: number
  certificateNumber?: string | null
  reason?: string | null
  isPaid?: boolean
}

const sanitizeDays = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1
  }
  return Math.max(1, Math.round(value))
}

const buildInsertPayload = (input: CreateMcRecordInput): MCRecordInsert => ({
  employee_id: input.employeeId,
  date: input.date,
  days: sanitizeDays(input.days),
  certificate_number: input.certificateNumber ?? null,
  reason: input.reason ?? null,
  is_paid: typeof input.isPaid === 'boolean' ? input.isPaid : true,
})

export const createMcRecord = async (input: CreateMcRecordInput): Promise<MCRecord> => {
  const supabase = getSupabaseClient()
  const payload = buildInsertPayload(input)

  const { data, error } = await supabase.from('mc_records').insert(payload).select('*').single()

  if (error || !data) {
    throw new Error(`创建病假记录失败：${error?.message ?? '未知错误'}`)
  }

  return mapRowToRecord(data)
}

export const deleteMcRecord = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('mc_records').delete().eq('id', id)
  if (error) {
    throw new Error(`删除病假记录失败：${error.message}`)
  }
}

export const upsertMcRecordForDate = async ({
  employeeId,
  date,
  isPaid,
}: {
  employeeId: string
  date: string
  isPaid: boolean
}): Promise<MCRecord> => {
  const updated = await updateMcRecordByDate({
    employeeId,
    date,
    updates: { is_paid: isPaid, days: 1 },
  })

  if (updated) {
    return updated
  }

  return createMcRecord({ employeeId, date, days: 1, isPaid })
}

export const updateMcRecordByDate = async ({
  employeeId,
  date,
  updates,
}: {
  employeeId: string
  date: string
  updates: Partial<Pick<MCRecordUpdate, 'is_paid' | 'days'>>
}): Promise<MCRecord | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('mc_records')
    .update(updates)
    .eq('employee_id', employeeId)
    .eq('date', date)
    .select('id, employee_id, date, days, certificate_number, reason, is_paid, created_at, updated_at')

  if (error) {
    throw new Error(`更新 ${date} 的病假记录失败：${error.message}`)
  }

  if (!data?.length) {
    return null
  }

  return mapRowToRecord(data[0])
}

export const deleteMcRecordByDate = async ({
  employeeId,
  date,
}: {
  employeeId: string
  date: string
}): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('mc_records').delete().eq('employee_id', employeeId).eq('date', date)
  if (error) {
    throw new Error(`删除 ${date} 的病假记录失败：${error.message}`)
  }
}

const parseYear = (value: number | string): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number.parseInt(String(value).slice(0, 4), 10)
  if (!Number.isFinite(parsed)) {
    return new Date().getUTCFullYear()
  }
  return parsed
}

export const getYearlyMcCount = async (employeeId: string, yearInput: number | string): Promise<number> => {
  const supabase = getSupabaseClient()
  const year = parseYear(yearInput)
  const start = `${year}-01-01`
  const end = `${year}-12-31`

  const { data, error } = await supabase
    .from('mc_records')
    .select('days')
    .eq('employee_id', employeeId)
    .gte('date', start)
    .lte('date', end)

  if (error) {
    throw new Error(`加载年度病假天数失败：${error.message}`)
  }

  return (data ?? []).reduce((total, row) => total + Math.max(0, row.days ?? 0), 0)
}
