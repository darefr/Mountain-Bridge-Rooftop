import { NextResponse } from 'next/server'
import { db, persist, persistDurable, hashPassword, ensureLoaded } from '@/lib/db/store'
import { verifyChallenge } from '@/lib/auth/codes'
import { validatePassword } from '@/lib/auth/password'
import { destroyAllSessions } from '@/lib/auth/session'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { notify } from '@/lib/notify'

export async function POST(req: Request) {
  await ensureLoaded()
  const { email, code, password } = await req.json().catch(() => ({}))
  const normalized = String(email || '').trim().toLowerCase()

  if (!normalized || !code || !password) {
    return NextResponse.json({ error: 'Email, code and new password are required.' }, { status: 400 })
  }

  const ip = clientIp(req)
  const rl = rateLimit(`reset:${ip}:${normalized}`, 10, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a few minutes and try again.' },
      { status: 429 },
    )
  }

  const pwError = validatePassword(password)
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 })
  }

  const user = db.users.find((u) => u.email === normalized)
  if (!user || !user.resetChallenge) {
    return NextResponse.json(
      { error: 'This reset code is invalid or has expired. Please request a new one.' },
      { status: 400 },
    )
  }

  const result = verifyChallenge(user.resetChallenge, String(code))
  if (!result.ok) {
    user.resetChallenge = result.challenge
    persist()
    return NextResponse.json({ error: result.error, locked: result.locked }, { status: 400 })
  }

  const { salt, passwordHash } = hashPassword(String(password))
  user.salt = salt
  user.passwordHash = passwordHash
  user.resetChallenge = undefined
  user.resetToken = undefined
  user.resetExpires = undefined
  await persistDurable()

  // Security: a password reset revokes every existing session (force re-login).
  await destroyAllSessions(user.id)

  notify(user.id, 'Password updated', 'Your password was changed successfully.', 'system')
  return NextResponse.json({ ok: true })
}
