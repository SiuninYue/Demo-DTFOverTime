import { enforceRateLimit, requireAuth } from '../_utils/security'

export const config = {
  runtime: 'edge',
}

interface RecognitionPreview {
  employeeName: string
  month?: string | null
  recognitionConfidence: number
  schedule: Record<string, unknown>
  warnings: string[]
  metadata: {
    imageName?: string
    imageSize?: number
    imageType?: string
  }
  status: 'NOT_IMPLEMENTED'
  message: string
}

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotImplementedError'
  }
}

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const parseFormData = async (request: Request) => {
  const formData = await request.formData()
  const image = formData.get('image')
  const userName = formData.get('userName')?.toString() ?? ''
  const month = formData.get('month')?.toString() ?? null

  if (!image || !(image instanceof File)) {
    return { error: 'IMAGE_REQUIRED' as const }
  }

  if (!userName) {
    return { error: 'USER_NAME_REQUIRED' as const }
  }

  return {
    image,
    userName,
    month,
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST /api/ocr/recognize is supported.',
      },
      405,
    )
  }

  try {
    const authError = requireAuth(request)
    if (authError) {
      return authError
    }

    const rateLimitError = enforceRateLimit(request, 8, 60_000)
    if (rateLimitError) {
      return rateLimitError
    }

    const parsed = await parseFormData(request)
    if ('error' in parsed) {
      const message =
        parsed.error === 'IMAGE_REQUIRED'
          ? 'An image file is required under the "image" form field.'
          : 'userName field is required to match the roster owner.'
      return jsonResponse({ error: parsed.error, message }, 400)
    }

    const response: RecognitionPreview = {
      employeeName: parsed.userName,
      month: parsed.month,
      recognitionConfidence: 0,
      schedule: {},
      warnings: ['OCR pipeline is scheduled for Phase B and is not available yet.'],
      metadata: {
        imageName: parsed.image.name,
        imageSize: parsed.image.size,
        imageType: parsed.image.type,
      },
      status: 'NOT_IMPLEMENTED',
      message:
        'OCR recognition will be implemented in Phase B (GPT-4 Vision). Please proceed with manual schedule entry.',
    }

    const error = new NotImplementedError(response.message) as NotImplementedError & {
      payload?: RecognitionPreview
    }
    error.payload = response
    throw error
  } catch (error) {
    if (error instanceof NotImplementedError) {
      const payload = (error as NotImplementedError & { payload?: RecognitionPreview }).payload
      return jsonResponse(
        {
          status: 'NOT_IMPLEMENTED',
          message: error.message,
          preview: payload,
        },
        501,
      )
    }

    console.error('[api/ocr/recognize] Unexpected error', error)
    return jsonResponse(
      {
        error: 'INTERNAL_ERROR',
        message: 'Unable to process OCR request at this time.',
      },
      500,
    )
  }
}
