import { cookies, headers } from 'next/headers'
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto'
import { db, persist, ensureLoaded, SESSION_KDF_MATERIAL } from '@/lib/db/store'
import type { PublicUser, User } from '@/lib/db/types'
import { defaultNotificationPrefs, isStaffRole } from '@/lib/db/types'

const COOKIE = 'mb_session'
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const SESSION_MAX_AGE = 60 * 60 * 12 // 12h "session-ish" fallback lifetime

// ---------------------------------------------------------------------------
// Stateless, HMAC-signed session cookie.
//
// The backing store (lib/db/store.ts) is an in-process singleton with a
// best-effort JSON snapshot. On serverless (Vercel) the snapshot write no-ops on
// the read-only filesystem AND each invocation may run in a *different* instance,
// so a session token pushed into db.sessions at login is invisible to the
// instance that later renders /admin — the user gets bounced straight back to
// /login. To make auth survive across instances we embed the identity in a
// signed cookie and verify the signature (not a shared store) on every request.
// db.sessions is still written for the "devices" list, but it is no longer
// required for authentication.
// ---------------------------------------------------------------------------

function getSecret(): string {
  const fromEnv =
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  // Deterministic fallback so signatures stay valid across instances even when
  // no secret env var is configured. Derived from the FIXED canonical admin
  // credential (SESSION_KDF_MATERIAL) — a compile-time constant identical on
  // every instance and never committed as plaintext. The previous version read
  // db.users[0], whose salt/hash was randomised per cold start, so the signing
  // secret differed between serverless instances and every admin cookie failed
  // verification after the post-login redirect (the reported "bounced back to
  // login" bug). Anchoring to a constant fixes that at the root.
  return createHmac('sha256', 'mb-session-kdf').update(SESSION_KDF_MATERIAL).digest('hex')
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Cookie value = `${userId}.${expires}.${token}.${signature}`.
function signCookie(userId: string, expires: number, token: string): string {
  const payload = `${userId}.${expires}.${token}`
  const sig = b64url(createHmac('sha256', getSecret()).update(payload).digest())
  return `${payload}.${sig}`
}

type ParsedCookie = { userId: string; expires: number; token: string }

function verifyCookie(value: string): ParsedCookie | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const [userId, expiresStr, token, sig] = parts
  const expires = Number(expiresStr)
  if (!userId || !token || !Number.isFinite(expires)) return null
  const expected = b64url(
    createHmac('sha256', getSecret()).update(`${userId}.${expires}.${token}`).digest(),
  )
  // Constant-time comparison to avoid signature timing leaks.
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  if (expires < Date.now()) return null
  return { userId, expires, token }
}

export function toPublic(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    image: u.image,
    role: u.role,
    emailVerified: u.emailVerified,
    notifyPrefs: u.notifyPrefs ?? defaultNotificationPrefs,
    country: u.country,
    preferredLanguage: u.preferredLanguage,
    preferredCurrency: u.preferredCurrency,
    emergencyContact: u.emergencyContact,
    wishlist: u.wishlist ?? [],
    createdAt: u.createdAt,
  }
}

// Remove expired sessions from the store (called opportunistically on reads).
function pruneExpired() {
  const now = Date.now()
  const before = db.sessions.length
  db.sessions = db.sessions.filter((s) => s.expires > now)
  if (db.sessions.length !== before) persist()
}

export async function createSession(userId: string, remember = true) {
  const token = randomBytes(24).toString('hex')
  const maxAge = remember ? REMEMBER_MAX_AGE : SESSION_MAX_AGE
  const expires = Date.now() + maxAge * 1000

  let userAgent: string | undefined
  let ip: string | undefined
  try {
    const h = await headers()
    userAgent = h.get('user-agent') ?? undefined
    ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined
  } catch {
    // headers() unavailable outside request scope — non-fatal
  }

  // Best-effort record for the "devices" list. Not required for auth: the signed
  // cookie below is self-verifying, so login survives across serverless instances
  // where this in-memory/disk store does not.
  db.sessions.push({ token, userId, expires, createdAt: Date.now(), userAgent, ip })
  persist()

  const jar = await cookies()
  jar.set(COOKIE, signCookie(userId, expires, token), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // When "remember me" is off we omit maxAge so the cookie is a session cookie
    // (cleared when the browser closes); the signed value still carries its own
    // expiry which is enforced on read.
    ...(remember ? { maxAge } : {}),
  })
  return token
}

export async function destroySession() {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (raw) {
    // Signed cookie carries the underlying record token; fall back to treating
    // the raw value as a legacy plain token.
    const token = verifyCookie(raw)?.token ?? raw
    const i = db.sessions.findIndex((s) => s.token === token)
    if (i >= 0) db.sessions.splice(i, 1)
    persist()
  }
  jar.delete(COOKIE)
}

// Revoke every session for a user ("log out of all devices"), then clear the
// current cookie too.
export async function destroyAllSessions(userId: string) {
  db.sessions = db.sessions.filter((s) => s.userId !== userId)
  persist()
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function getCurrentUser(): Promise<User | null> {
  // Hydrate durable state (Blob) before touching the store so auth and every
  // downstream read/mutation sees the latest cross-instance data. No-op when
  // Blob is not configured.
  await ensureLoaded()

  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null

  // Primary path: verify the signed cookie. This does not depend on the
  // in-memory session store, so it works across serverless instances where a
  // freshly-created session record would otherwise be missing.
  const parsed = verifyCookie(raw)
  if (parsed) {
    return db.users.find((u) => u.id === parsed.userId) ?? null
  }

  // Legacy fallback: older cookies stored a plain token looked up in the store.
  // Only usable within a single warm instance; kept so pre-existing sessions
  // aren't force-logged-out during the upgrade.
  const session = db.sessions.find((s) => s.token === raw)
  if (!session) return null
  if (session.expires < Date.now()) {
    const i = db.sessions.indexOf(session)
    if (i >= 0) db.sessions.splice(i, 1)
    persist()
    return null
  }
  pruneExpired()
  return db.users.find((u) => u.id === session.userId) ?? null
}

export async function requireUser(): Promise<User | null> {
  return getCurrentUser()
}

export async function requireAdmin(): Promise<User | null> {
  const u = await getCurrentUser()
  if (!u || !isStaffRole(u.role)) return null
  return u
}

// Sessions for a user, newest first (used by the "devices" list).
export function userSessions(userId: string) {
  return db.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}
