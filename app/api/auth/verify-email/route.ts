import { NextResponse } from 'next/server'
import { persist, persistDurable } from '@/lib/db/store'
import { getCurrentUser, toPublic } from '@/lib/auth/session'
import { verifyChallenge } from '@/lib/auth/codes'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { notify } from '@/lib/notify'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to verify your email.' }, { status: 401 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, user: toPublic(user) })
  }

  // Throttle code submissions per user + IP.
  const ip = clientIp(req)
  const rl = rateLimit(`verify:${user.id}:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a few minutes and try again.' },
      { status: 429 },
    )
  }

  const { code } = await req.json().catch(() => ({}))
  if (!user.emailChallenge) {
    return NextResponse.json(
      { error: 'No active verification code. Please request a new one.' },
      { status: 400 },
    )
  }

  const result = verifyChallenge(user.emailChallenge, String(code || ''))
  if (!result.ok) {
    // Persist the incremented attempt counter / lockout state.
    user.emailChallenge = result.challenge
    persist()
    return NextResponse.json({ error: result.error, locked: result.locked }, { status: 400 })
  }

  user.emailVerified = true
  user.emailChallenge = undefined
  user.verifyToken = undefined
  await persistDurable()
  notify(user.id, 'Email verified', 'Thanks for verifying your email address.', 'system')

  return NextResponse.json({ ok: true, user: toPublic(user) })
}
