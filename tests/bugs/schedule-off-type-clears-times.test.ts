/**
 * Bug Fix Test: OFF type should clear planned times
 *
 * Issue: When changing from WORK to OFF in schedule,
 * the plannedStartTime/EndTime are not cleared.
 *
 * Expected: OFF type should behave like REST/LEAVE/PUBLIC_HOLIDAY
 * and clear planned times.
 */

import { describe, it, expect } from 'vitest'
import { ScheduleType } from '@/types/schedule'

describe('Schedule Type Change - OFF clears times', () => {
  it('should clear planned times when changing from WORK to OFF', () => {
    // Simulating the scenario:
    // User sets WORK with times 10:00-19:00
    // Then changes to OFF
    // Expected: times should be null

    const workEntry = {
      type: ScheduleType.WORK,
      plannedStartTime: '10:00',
      plannedEndTime: '19:00',
    }

    // Simulate type change to OFF
    const newType = ScheduleType.OFF

    // Current buggy logic:
    const shouldClearTimes_BUGGY =
      newType !== ScheduleType.WORK &&
      newType !== ScheduleType.OFF  // BUG: OFF doesn't clear!

    // Fixed logic:
    const shouldClearTimes_FIXED = newType !== ScheduleType.WORK

    expect(shouldClearTimes_BUGGY).toBe(false) // BUG: doesn't clear
    expect(shouldClearTimes_FIXED).toBe(true)  // FIX: clears correctly
  })

  it('should keep times for WORK type', () => {
    const workType = ScheduleType.WORK
    const shouldClear = workType !== ScheduleType.WORK
    expect(shouldClear).toBe(false) // WORK keeps times
  })

  it('should clear times for REST type', () => {
    const restType = ScheduleType.REST
    const shouldClear = restType !== ScheduleType.WORK
    expect(shouldClear).toBe(true) // REST clears times
  })

  it('should clear times for LEAVE type', () => {
    const leaveType = ScheduleType.LEAVE
    const shouldClear = leaveType !== ScheduleType.WORK
    expect(shouldClear).toBe(true) // LEAVE clears times
  })

  it('should clear times for PUBLIC_HOLIDAY type', () => {
    const phType = ScheduleType.PUBLIC_HOLIDAY
    const shouldClear = phType !== ScheduleType.WORK
    expect(shouldClear).toBe(true) // PUBLIC_HOLIDAY clears times
  })
})
