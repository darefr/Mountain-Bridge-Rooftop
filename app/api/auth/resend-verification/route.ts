import { NextResponse } from 'next/server'
import { persistDurable } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { createChallenge, canResend } from '@/lib/auth/codes'
import { sendVerificationCode, isEmailConfigured } from '@/lib/email/mailer'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  const ip = clientIp(req)
  const rl = rateLimit(`resend-verify:${user.id}:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  const gate = canResend(user.emailChallenge)
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error, retryAfterMs: gate.retryAfterMs },
      { status: 429 },
    )
  }

  // A new challenge overwrites (invalidates) any previous code.
  const prevCount = user.emailChallenge?.resendCount ?? 0
  const { challenge, code } = createChallenge(prevCount + 1)
  user.emailChallenge = challenge
  await persistDurable()

  const send = await sendVerificationCode(user.email, user.name, code)

  const devCode =
    !isEmailConfigured() && process.env.NODE_ENV !== 'production' ? code : undefined

  // If delivery failed, tell the client honestly rather than reporting success.
  // The new code is still stored and valid — a dev code is provided in non-prod
  // so the flow stays testable while SMTP is being configured.
  if (!send.delivered) {
    return NextResponse.json(
      {
        error:
          send.reason === 'unconfigured'
            ? 'Email delivery is not configured yet, so the code could not be sent.'
            : 'Unable to send the verification email right now. Please try again shortly.',
        missingEnv: send.missing,
        devCode,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, devCode })
}
