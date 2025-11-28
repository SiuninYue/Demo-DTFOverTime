import { beforeEach, describe, expect, it } from 'vitest'
import { useTimecardStore } from '@/store/timecardStore'
import { DayType, type TimeRecord } from '@/types/timecard'

const buildRecord = (date: string, overrides: Partial<TimeRecord> = {}): TimeRecord => ({
  date,
  dayType: DayType.NORMAL_WORK_DAY,
  actualStartTime: '10:00',
  actualEndTime: '19:00',
  restHours: 1,
  isEmployerRequested: true,
  spansMidnight: false,
  ...overrides,
})

describe('useTimecardStore', () => {
  beforeEach(() => {
    useTimecardStore.getState().clear()
  })

  it('upserts records and refreshes summary', () => {
    useTimecardStore.getState().upsertRecord(buildRecord('2025-11-01'))
    const record = buildRecord('2025-11-02', {
      actualEndTime: '21:00',
    })
    useTimecardStore.getState().upsertRecord(record)

    const monthState = useTimecardStore.getState()
    const novemberRecords = monthState.recordsByMonth['2025-11']
    expect(Object.keys(novemberRecords)).toHaveLength(2)

    const summary = monthState.summaries['2025-11']
    expect(summary.totalRecords).toBe(2)
    expect(summary.totalHours).toBeGreaterThan(15)
    expect(summary.overtimeHours).toBeGreaterThan(0)
  })

  it('loads data via async loader helper', async () => {
    const loader = async () => [buildRecord('2025-11-03', { dayType: DayType.REST_DAY })]
    await expect(useTimecardStore.getState().loadMonth('2025-11', loader)).resolves.toHaveLength(1)

    const state = useTimecardStore.getState()
    expect(state.statusByMonth['2025-11']).toBe('ready')
    expect(state.summaries['2025-11'].restDayEntries).toBe(1)
  })

  it('flips into offline mode when loader fails but cache exists', async () => {
    useTimecardStore.getState().upsertRecord(buildRecord('2025-11-04'))

    const failingLoader = async () => {
      throw new Error('supabase timeout')
    }

    await expect(useTimecardStore.getState().loadMonth('2025-11', failingLoader)).rejects.toThrow(
      'supabase timeout',
    )

    const state = useTimecardStore.getState()
    expect(state.statusByMonth['2025-11']).toBe('error')
    expect(state.isOffline).toBe(true)
  })

  it('removes records and recomputes summary counts', () => {
    useTimecardStore.getState().upsertRecord(buildRecord('2025-11-05'))
    useTimecardStore.getState().removeRecord('2025-11-05')

    const state = useTimecardStore.getState()
    expect(state.recordsByMonth['2025-11']).toEqual({})
    expect(state.summaries['2025-11'].totalRecords).toBe(0)
  })
})
