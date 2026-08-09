import { randomInt, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { CodeChallenge } from '@/lib/db/types'

// ---------------------------------------------------------------------------
// One-time 6-digit verification / reset codes.
// The raw code is only ever returned once (to be emailed); the store keeps a
// salted scrypt hash so a leaked database cannot reveal live codes.
// ---------------------------------------------------------------------------

export const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const MAX_ATTEMPTS = 5 // wrong-code attempts before lockout
export const RESEND_COOLDOWN_MS = 60 * 1000 // 60s between resends
export const MAX_RESENDS = 5 // resends allowed per challenge lifecycle

function hashCode(code: string, salt: string) {
  return scryptSync(code, salt, 32).toString('hex')
}

// Uniformly random 6-digit numeric code (100000–999999).
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// Create a brand-new challenge. Any previous challenge should simply be
// overwritten by the caller, which invalidates it.
export function createChallenge(previousResendCount = 0): {
  challenge: CodeChallenge
  code: string
} {
  const code = generateCode()
  const salt = randomBytes(16).toString('hex')
  const now = Date.now()
  return {
    code,
    challenge: {
      codeHash: hashCode(code, salt),
      salt,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      resendCount: previousResendCount,
      lastSentAt: now,
    },
  }
}

export type VerifyResult =
  | { ok: true; challenge: CodeChallenge }
  | { ok: false; error: string; locked?: boolean; challenge: CodeChallenge }

// Validate a submitted code against a challenge. Returns an updated challenge
// (attempt counter incremented on failure) so the caller can persist it.
export function verifyChallenge(challenge: CodeChallenge, submitted: string): VerifyResult {
  const code = String(submitted || '').trim()

  if (Date.now() > challenge.expiresAt) {
    return { ok: false, error: 'This code has expired. Please request a new one.', challenge }
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    return {
      ok: false,
      error: 'Too many incorrect attempts. Please request a new code.',
      locked: true,
      challenge,
    }
  }
  if (!/^\d{6}$/.test(code)) {
    const updated = { ...challenge, attempts: challenge.attempts + 1 }
    return { ok: false, error: 'Enter the 6-digit code from your email.', challenge: updated }
  }

  const expected = Buffer.from(challenge.codeHash, 'hex')
  const actual = Buffer.from(hashCode(code, challenge.salt), 'hex')
  const match = expected.length === actual.length && timingSafeEqual(expected, actual)

  if (!match) {
    const updated = { ...challenge, attempts: challenge.attempts + 1 }
    const remaining = updated.maxAttempts - updated.attempts
    return {
      ok: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      locked: remaining <= 0,
      challenge: updated,
    }
  }

  return { ok: true, challenge }
}

// Whether a fresh code may be sent yet (cooldown + max resend guard).
export function canResend(challenge: CodeChallenge | undefined): {
  ok: boolean
  error?: string
  retryAfterMs?: number
} {
  if (!challenge) return { ok: true }
  if (challenge.resendCount >= MAX_RESENDS) {
    return { ok: false, error: 'Resend limit reached. Please try again later or contact us.' }
  }
  const elapsed = Date.now() - challenge.lastSentAt
  if (elapsed < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      error: 'Please wait a moment before requesting another code.',
      retryAfterMs: RESEND_COOLDOWN_MS - elapsed,
    }
  }
  return { ok: true }
}
