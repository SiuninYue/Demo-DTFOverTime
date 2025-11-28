import { getSupabaseClient } from '@/config/supabase'
import type { Database, Json } from '@/types/supabase'
import type { SalaryResult } from '@/types/salary'

const serializeDetails = (details: SalaryResult['calculationDetails']): Json =>
  JSON.parse(JSON.stringify(details)) as Json

type MonthlySalaryRow = Database['public']['Tables']['monthly_salaries']['Row']
type MonthlySalaryInsert = Database['public']['Tables']['monthly_salaries']['Insert']

export interface MonthlySalarySummary {
  id: string
  employeeId: string
  month: string
  baseSalary: number
  attendanceBonus: number
  overtimePay: number
  restDayPay: number
  publicHolidayPay: number
  deductions: number
  totalGross: number
  status: string | null
  estimatedPayDate: string | null
  actualPayDate: string | null
  calculationDetails: SalaryResult['calculationDetails'] | null
  createdAt: string | null
  updatedAt: string | null
}

const mapRowToSummary = (row: MonthlySalaryRow): MonthlySalarySummary => ({
  id: row.id,
  employeeId: row.employee_id,
  month: row.month,
  baseSalary: row.base_salary,
  attendanceBonus: row.attendance_bonus ?? 0,
  overtimePay: row.overtime_pay ?? 0,
  restDayPay: row.rest_day_pay ?? 0,
  publicHolidayPay: row.ph_pay ?? 0,
  deductions: row.deductions ?? 0,
  totalGross: row.total_gross,
  status: row.status ?? null,
  estimatedPayDate: row.estimated_pay_date ?? null,
  actualPayDate: row.actual_pay_date ?? null,
  calculationDetails: (row.calculation_details as SalaryResult['calculationDetails'] | null) ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
})

export const getMonthlySummary = async (
  employeeId: string,
  month: string,
): Promise<MonthlySalarySummary | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('monthly_salaries')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('month', month)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch monthly salary summary: ${error.message}`)
  }

  return data ? mapRowToSummary(data) : null
}

export interface UpsertMonthlySummaryParams {
  employeeId: string
  month: string
  summary: SalaryResult
  estimatedPayDate?: string | null
  actualPayDate?: string | null
  status?: 'PENDING' | 'CONFIRMED' | 'PAID'
}

export const upsertMonthlySummary = async ({
  employeeId,
  month,
  summary,
  estimatedPayDate = null,
  actualPayDate = null,
  status = 'PENDING',
}: UpsertMonthlySummaryParams): Promise<MonthlySalarySummary> => {
  const supabase = getSupabaseClient()

  const payload: MonthlySalaryInsert = {
    employee_id: employeeId,
    month,
    base_salary: summary.baseSalary,
    attendance_bonus: summary.attendanceBonus,
    overtime_pay: summary.overtimePay,
    rest_day_pay: summary.restDayPay,
    ph_pay: summary.publicHolidayPay,
    deductions: summary.deductions,
    total_gross: summary.totalGross,
    estimated_pay_date: estimatedPayDate,
    actual_pay_date: actualPayDate,
    status,
    calculation_details: serializeDetails(summary.calculationDetails),
  }

  const { data, error } = await supabase
    .from('monthly_salaries')
    .upsert(payload, { onConflict: 'employee_id,month' })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert monthly salary summary: ${error?.message ?? 'Unknown error'}`)
  }

  return mapRowToSummary(data)
}
