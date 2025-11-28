const rateBuckets = new Map<
  string,
  {
    count: number
    resetAt: number
  }
>()

const unauthorizedResponse = () =>
  new Response(
    JSON.stringify({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header.',
    }),
    {
      status: 401,
      headers: { 'content-type': 'application/json' },
    },
  )

export const requireAuth = (request: Request) => {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorizedResponse()
  }

  return null
}

const getIdentifier = (request: Request) => {
  return (
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'anonymous'
  )
}

export const enforceRateLimit = (request: Request, limit: number, windowMs: number) => {
  const identifier = getIdentifier(request)
  const now = Date.now()
  const bucket = rateBuckets.get(identifier)

  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(identifier, { count: 1, resetAt: now + windowMs })
    return null
  }

  bucket.count += 1
  if (bucket.count > limit) {
    const retryAfter = Math.max(0, Math.floor((bucket.resetAt - now) / 1000))
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down.',
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(retryAfter),
        },
      },
    )
  }

  return null
}
