import { NextResponse } from 'next/server'
import { db, persistDurable, ensureLoaded } from '@/lib/db/store'
import { createChallenge, canResend } from '@/lib/auth/codes'
import { sendPasswordResetCode, isEmailConfigured } from '@/lib/email/mailer'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  await ensureLoaded()
  const { email } = await req.json().catch(() => ({}))
  const normalized = String(email || '').trim().toLowerCase()
  const ip = clientIp(req)

  // Throttle per IP and per email to prevent enumeration / mail flooding.
  const rlIp = rateLimit(`forgot:${ip}`, 6, 15 * 60 * 1000)
  const rlEmail = rateLimit(`forgot:email:${normalized}`, 4, 15 * 60 * 1000)
  if (!rlIp.ok || !rlEmail.ok) {
    // Still return the neutral response shape so nothing is leaked.
    return NextResponse.json({ ok: true })
  }

  const user = db.users.find((u) => u.email === normalized)

  // Always respond success to avoid leaking which emails exist.
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  // Respect resend cooldown on an existing reset challenge.
  const gate = canResend(user.resetChallenge)
  if (!gate.ok) {
    return NextResponse.json({ ok: true })
  }

  const prevCount = user.resetChallenge?.resendCount ?? 0
  const { challenge, code } = createChallenge(prevCount + (user.resetChallenge ? 1 : 0))
  user.resetChallenge = challenge
  // Clear any legacy token fields.
  user.resetToken = undefined
  user.resetExpires = undefined
  await persistDurable()

  await sendPasswordResetCode(user.email, user.name, code)

  const devCode =
    !isEmailConfigured() && process.env.NODE_ENV !== 'production' ? code : undefined

  return NextResponse.json({ ok: true, devCode })
}
