import { createHash, timingSafeEqual } from 'node:crypto'
import { createError, type H3Event } from 'h3'

const digest = (value: string) => createHash('sha256').update(value).digest()

/** Throws 500 if the secret is unset, 401 if the header password is wrong. Constant-time compare. */
export function requireSubmitPassword(event: H3Event, label: string) {
  const masterPassword = process.env.SUBMIT_PASSWORD
  if (!masterPassword) {
    console.error(`[${label}] SUBMIT_PASSWORD env var is not set`)
    throw createError({ statusCode: 500, statusMessage: 'Server misconfiguration.' })
  }

  const provided = event.headers.get('x-submit-password') ?? ''
  if (!provided || !timingSafeEqual(digest(provided), digest(masterPassword))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Invalid or missing password.',
    })
  }
}
