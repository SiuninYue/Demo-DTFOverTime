import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { uploadImageToSupabase } from '@/services/supabase/uploadImage'
import { upsertSchedule, getScheduleByMonth } from '@/services/supabase/database'
import { useScheduleStore } from '@/store/scheduleStore'
import { ScheduleType, type ScheduleData } from '@/types/schedule'

const month = '2025-11'
const employeeId = 'employee-ocr'

const recognizedSchedule: ScheduleData = {
  '2025-11-01': {
    type: ScheduleType.WORK,
    plannedStartTime: '10:00',
    plannedEndTime: '19:00',
    isStatutoryRestDay: false,
    notes: 'Shift A',
    isConfirmed: true,
  },
  '2025-11-02': {
    type: ScheduleType.REST,
    plannedStartTime: null,
    plannedEndTime: null,
    isStatutoryRestDay: true,
    notes: 'REST',
    isConfirmed: true,
  },
}

const server = setupServer(
  http.post('*/api/ocr/recognize', async ({ request }) => {
    const formData = await request.formData()
    const userName = formData.get('userName')?.toString() ?? 'Unknown'
    return HttpResponse.json({
      employeeName: userName,
      recognitionConfidence: 0.94,
      schedule: recognizedSchedule,
    })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useScheduleStore.getState().clear()
})
afterAll(() => server.close())

describe('Integration: OCR upload pipeline', () => {
  it('uploads image, receives OCR payload, persists schedule, and hydrates the calendar store', async () => {
    const file = new File(['mock-roster-data'], 'roster.jpg', { type: 'image/jpeg' })
    const upload = await uploadImageToSupabase({
      employeeId,
      month,
      file,
    })

    expect(upload.bucket).toBe('schedule-images')
    expect(upload.path).toContain(employeeId)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('userName', 'Kelly Tein')
    formData.append('month', month)

    const response = await fetch('/api/ocr/recognize', {
      method: 'POST',
      body: formData,
    })
    expect(response.status).toBe(200)
    const payload = (await response.json()) as {
      employeeName: string
      recognitionConfidence: number
      schedule: ScheduleData
    }

    expect(payload.employeeName).toBe('Kelly Tein')
    expect(Object.keys(payload.schedule)).toHaveLength(2)

    const saved = await upsertSchedule({
      employeeId,
      month,
      scheduleData: payload.schedule,
      imageUrl: upload.publicUrl,
      imageFileName: upload.fileName,
      imageSize: upload.size,
      recognitionAccuracy: payload.recognitionConfidence,
      recognitionMethod: 'GPT4_VISION',
    })

    useScheduleStore.getState().setSchedule(saved)

    const fetched = await getScheduleByMonth(employeeId, month)
    expect(fetched).not.toBeNull()
    expect(fetched?.scheduleData['2025-11-01']?.plannedStartTime).toBe('10:00')
    expect(fetched?.recognitionAccuracy).toBeCloseTo(0.94, 2)

    const calendarState = useScheduleStore.getState().getSchedule(month)
    expect(calendarState?.scheduleData['2025-11-02']?.isStatutoryRestDay).toBe(true)
    expect(calendarState?.originalImageUrl).toBe(upload.publicUrl)
  })
})
