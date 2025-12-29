export const normalizeTimeToMinutes = (value: string | null | undefined) => {
  if (!value) return value
  const [hours, minutes] = value.split(':')
  if (minutes === undefined) return value
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export const normalizeTimeRecord = <
  T extends { actualStartTime?: string | null; actualEndTime?: string | null },
>(
  record: T,
): T => {
  const nextStart = normalizeTimeToMinutes(record.actualStartTime)
  const nextEnd = normalizeTimeToMinutes(record.actualEndTime)

  if (nextStart === record.actualStartTime && nextEnd === record.actualEndTime) {
    return record
  }

  return {
    ...record,
    actualStartTime: nextStart,
    actualEndTime: nextEnd,
  }
}
