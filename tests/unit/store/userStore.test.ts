import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '@/store/userStore'
import { CalculationMode, WorkScheduleType, type Employee } from '@/types/employee'

const buildProfile = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  email: 'demo@dtf.sg',
  name: 'Demo User',
  employeeId: 'DTF-001',
  position: 'Chef',
  baseSalary: 1770,
  attendanceBonus: 200,
  workScheduleType: WorkScheduleType.FIVE_DAY,
  normalWorkHours: 8,
  defaultRestHours: 1,
  outletCode: 'ION',
  isWorkman: true,
  isPartIVApplicable: true,
  payDay: 7,
  startDate: '2024-01-15',
  calculationMode: CalculationMode.FULL_COMPLIANCE,
  ...overrides,
})

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.getState().clear()
  })

  it('hydrates profile and computed metrics', () => {
    const profile = buildProfile()
    useUserStore.getState().setProfile(profile)

    const state = useUserStore.getState()
    expect(state.profile).not.toBeNull()
    expect(state.profile?.name).toBe('Demo User')
    expect(state.computed?.hourlyRate).toBeCloseTo(9.28, 2)
    expect(state.computed?.dailyRate).toBeGreaterThan(80)
    expect(state.partIV.isApplicable).toBe(true)
    expect(state.status).toBe('ready')
  })

  it('overrides Part IV applicability while keeping profile in sync', () => {
    useUserStore.getState().setProfile(buildProfile({ isPartIVApplicable: true }))
    useUserStore.getState().overridePartIV(false, 'Salary exceeds limit')

    const state = useUserStore.getState()
    expect(state.partIV.isApplicable).toBe(false)
    expect(state.partIV.overrideReason).toBe('Salary exceeds limit')
    expect(state.profile?.isPartIVApplicable).toBe(false)
    expect(state.computed?.isPartIVApplicable).toBe(false)
  })

  it('loads profile through async loader helper', async () => {
    const loader = async () => buildProfile({ name: 'Async User' })
    await expect(useUserStore.getState().loadProfile(loader)).resolves.toMatchObject({
      name: 'Async User',
    })

    const state = useUserStore.getState()
    expect(state.profile?.name).toBe('Async User')
    expect(state.status).toBe('ready')
  })

  it('flags errors when loader fails', async () => {
    const loader = async () => {
      throw new Error('network unreachable')
    }

    await expect(useUserStore.getState().loadProfile(loader)).rejects.toThrow('network unreachable')
    expect(useUserStore.getState().status).toBe('error')
    expect(useUserStore.getState().error).toBe('network unreachable')
  })
})
