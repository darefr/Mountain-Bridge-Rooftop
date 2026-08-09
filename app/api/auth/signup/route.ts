import { NextResponse } from 'next/server'
import { db, persistDurable, uid, hashPassword, ensureLoaded } from '@/lib/db/store'
import { createSession, toPublic } from '@/lib/auth/session'
import { createChallenge } from '@/lib/auth/codes'
import { validatePassword } from '@/lib/auth/password'
import { sendVerificationCode, isEmailConfigured } from '@/lib/email/mailer'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { notify } from '@/lib/notify'
import { defaultNotificationPrefs, type User } from '@/lib/db/types'

export async function POST(req: Request) {
  await ensureLoaded()
  // Throttle account creation per IP (5 / 15 min) to slow abuse.
  const ip = clientIp(req)
  const rl = rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const { name, email, phone, country, password, confirm, acceptTerms, acceptPrivacy } = await req
    .json()
    .catch(() => ({}))

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }
  if (typeof confirm === 'string' && confirm !== password) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
  }
  // Legal acceptance is required server-side (not just in the UI).
  if (acceptTerms !== true || acceptPrivacy !== true) {
    return NextResponse.json(
      { error: 'You must accept the Terms & Conditions and Privacy Policy.' },
      { status: 400 },
    )
  }
  const pwError = validatePassword(password)
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 })
  }
  const normalized = String(email).trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (db.users.some((u) => u.email === normalized)) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const { salt, passwordHash } = hashPassword(String(password))
  const { challenge, code } = createChallenge()

  const user: User = {
    id: uid(),
    email: normalized,
    name: String(name).trim(),
    phone: phone ? String(phone).trim() : undefined,
    country: country ? String(country).trim() : undefined,
    salt,
    passwordHash,
    role: 'customer',
    emailVerified: false,
    notifyPrefs: { ...defaultNotificationPrefs },
    emailChallenge: challenge,
    createdAt: Date.now(),
  }
  db.users.push(user)
  await persistDurable()

  notify(
    user.id,
    'Welcome to Hotel Mountain Bridge',
    'Your account is ready. Enter the 6-digit code we emailed you to verify your address.',
    'system',
  )

  // Send the verification email (raw code leaves the server only via email).
  const send = await sendVerificationCode(user.email, user.name, code)

  // Create a pending session so the verification page knows who to verify.
  // The account exists and is unverified regardless of email outcome — the user
  // can retry delivery via "Resend code" once email is configured/working.
  await createSession(user.id, true)

  // In local/preview without SMTP, surface the code so the flow stays testable.
  const devCode =
    !isEmailConfigured() && process.env.NODE_ENV !== 'production' ? code : undefined

  // Honestly report whether the verification email actually went out. We never
  // claim success when SMTP is unconfigured or the send failed — the client
  // shows a clear message instead of silently pretending the inbox has mail.
  if (!send.delivered) {
    return NextResponse.json({
      user: toPublic(user),
      needsVerification: true,
      emailSent: false,
      // Safe, non-sensitive diagnostics. `missingEnv` is variable NAMES only.
      emailError:
        send.reason === 'unconfigured'
          ? 'Your account was created, but the verification email could not be sent because email delivery is not configured yet.'
          : 'Your account was created, but we could not send the verification email right now. Please use \u201CResend code\u201D.',
      missingEnv: send.missing,
      devCode,
    })
  }

  return NextResponse.json({
    user: toPublic(user),
    needsVerification: true,
    emailSent: true,
    devCode,
  })
}
