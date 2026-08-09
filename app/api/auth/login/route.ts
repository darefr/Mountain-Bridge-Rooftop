import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, verifyPassword, ensureLoaded } from '@/lib/db/store'
import { createSession, toPublic } from '@/lib/auth/session'
import { rateLimit, resetRateLimit, clientIp } from '@/lib/rate-limit'
import { LOCALE_COOKIE } from '@/lib/i18n/config'

export async function POST(req: Request) {
  // Hydrate durable state so accounts created on other instances are visible.
  await ensureLoaded()
  const { email, password, remember } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  const normalized = String(email).trim().toLowerCase()
  const ip = clientIp(req)

  // Throttle by IP+email to slow credential-stuffing without locking real users
  // out globally. 8 attempts / 15 min.
  const key = `login:${ip}:${normalized}`
  const rl = rateLimit(key, 8, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a few minutes and try again.' },
      { status: 429 },
    )
  }

  const user = db.users.find((u) => u.email === normalized)
  // Same generic message + same code path whether the user exists or not.
  if (!user || !verifyPassword(String(password), user.salt, user.passwordHash)) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
  }

  // Successful login clears the failed-attempt counter for this key.
  resetRateLimit(key)
  await createSession(user.id, remember !== false)

  // Apply the account's saved language preference across devices by syncing the
  // locale cookie the app reads on the server.
  if (user.preferredLanguage === 'en' || user.preferredLanguage === 'ne') {
    const jar = await cookies()
    jar.set(LOCALE_COOKIE, user.preferredLanguage, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return NextResponse.json({ user: toPublic(user) })
}
