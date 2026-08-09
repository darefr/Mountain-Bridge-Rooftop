// Shared password policy used on both the server (authoritative) and the client
// (instant feedback / strength meter). Keep the two in sync by importing this.

export const PASSWORD_MIN_LENGTH = 8

export type PasswordCheck = {
  label: string
  met: boolean
}

export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: pw.length >= PASSWORD_MIN_LENGTH },
    { label: 'One lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'One uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'One number', met: /[0-9]/.test(pw) },
  ]
}

// 0–4 score for a strength meter.
export function passwordScore(pw: string): number {
  return passwordChecks(pw).filter((c) => c.met).length
}

// Returns an error message if the password is too weak, or null if acceptable.
export function validatePassword(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter.'
  if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must include a number.'
  return null
}
