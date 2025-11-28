import type { AttendanceBonusImpact } from '@/types/salary'

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export interface AttendanceBonusParams {
  baseAmount: number
  mcDays?: number
  unpaidLeaveDays?: number
}

export interface AttendanceBonusResult {
  amount: number
  impact: AttendanceBonusImpact
}

const buildReason = (mcDays: number, unpaidLeaveDays: number, rate: number): string => {
  const percentage = Math.round(rate * 100)
  return `MC ${mcDays}d + unpaid ${unpaidLeaveDays}d -> ${percentage}%`
}

export const calculateAttendanceBonus = ({
  baseAmount,
  mcDays = 0,
  unpaidLeaveDays = 0,
}: AttendanceBonusParams): AttendanceBonusResult => {
  const sanitizedBase = Math.max(0, baseAmount)
  const sanitizedMcDays = Math.max(0, mcDays)
  const sanitizedUnpaid = Math.max(0, unpaidLeaveDays)
  const totalAbsence = sanitizedMcDays + sanitizedUnpaid

  let rate = 0
  if (totalAbsence <= 2) {
    rate = 1
  } else if (totalAbsence === 3) {
    rate = 0.5
  } else {
    rate = 0
  }

  const amount = roundMoney(sanitizedBase * rate)
  const impact: AttendanceBonusImpact = {
    fullAmount: roundMoney(sanitizedBase),
    actualAmount: amount,
    rate,
    reason: buildReason(sanitizedMcDays, sanitizedUnpaid, rate),
  }

  return { amount, impact }
}
