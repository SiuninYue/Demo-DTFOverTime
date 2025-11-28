import { enforceRateLimit, requireAuth } from '../_utils/security'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const body = await request.json().catch(() => null)

  if (!body) {
    return new Response(
      JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Request body must be valid JSON.',
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
  }

  const authError = requireAuth(request)
  if (authError) {
    return authError
  }

  const rateLimitError = enforceRateLimit(request, 20, 60_000)
  if (rateLimitError) {
    return rateLimitError
  }

  if (typeof body.baseSalary !== 'number' || !Array.isArray(body.records)) {
    return new Response(
      JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Payload requires numeric baseSalary and an array of records.',
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
  }

  const invalidRecord = body.records.find(
    (record: Record<string, unknown>) =>
      typeof record.dayType !== 'string' || typeof record.hoursWorked !== 'number',
  )

  if (invalidRecord) {
    return new Response(
      JSON.stringify({
        error: 'INVALID_RECORD',
        message: 'Each record requires dayType (string) and hoursWorked (number).',
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      message: 'Salary calculation service placeholder',
      received: body,
    }),
    { status: 202, headers: { 'content-type': 'application/json' } },
  )
}
