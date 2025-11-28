export enum WorkScheduleType {
  FIVE_DAY = 'FIVE_DAY',
  FIVE_HALF_DAY = 'FIVE_HALF_DAY',
  SIX_DAY = 'SIX_DAY',
  FOUR_DAY = 'FOUR_DAY',
  CUSTOM = 'CUSTOM',
}

export enum CalculationMode {
  FULL_COMPLIANCE = 'FULL_COMPLIANCE',
  BASIC_TRACKING = 'BASIC_TRACKING',
}

export interface Employee {
  id: string
  email: string
  name: string
  employeeId?: string
  position?: string
  baseSalary: number
  attendanceBonus: number
  workScheduleType: WorkScheduleType
  normalWorkHours: number
  defaultRestHours: number
  outletCode?: string
  isWorkman: boolean
  isPartIVApplicable: boolean
  payDay: number
  startDate?: string
  calculationMode: CalculationMode
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeComputed extends Employee {
  hourlyRate: number
  dailyRate: number
  monthlyWorkingDays: number
}
