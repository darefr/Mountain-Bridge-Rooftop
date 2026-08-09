import { NextResponse } from 'next/server'
import { persist, hashPassword, verifyPassword } from '@/lib/db/store'
import { getCurrentUser, toPublic } from '@/lib/auth/session'
import { validatePassword } from '@/lib/auth/password'
import { defaultNotificationPrefs, type NotificationPrefs } from '@/lib/db/types'

// Max size for an inline (data URL) profile image — keeps the JSON store small.
const MAX_IMAGE_BYTES = 512 * 1024 // 512 KB

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const {
    name,
    phone,
    image,
    notifyPrefs,
    country,
    preferredLanguage,
    preferredCurrency,
    emergencyContact,
    currentPassword,
    newPassword,
  } = await req.json().catch(() => ({}))

  if (typeof name === 'string' && name.trim()) user.name = name.trim()
  if (typeof phone === 'string') user.phone = phone.trim() || undefined
  if (typeof country === 'string') user.country = country.trim() || undefined

  // Preferred language / currency — validated against known values.
  if (preferredLanguage === 'en' || preferredLanguage === 'ne') {
    user.preferredLanguage = preferredLanguage
  }
  if (preferredCurrency === 'USD' || preferredCurrency === 'NPR') {
    user.preferredCurrency = preferredCurrency
  }

  // Emergency contact (optional). Trim + cap length; clear when all blank.
  if (emergencyContact && typeof emergencyContact === 'object') {
    const cap = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 120) : '')
    const ec = {
      name: cap(emergencyContact.name),
      phone: cap(emergencyContact.phone),
      relation: cap(emergencyContact.relation),
    }
    user.emergencyContact = ec.name || ec.phone || ec.relation ? ec : undefined
  }

  // Profile image: accept a data URL (validated) or a same-origin path, or ''
  // to clear it. Reject anything else to avoid SSRF/oversized payloads.
  if (typeof image === 'string') {
    if (image === '') {
      user.image = undefined
    } else if (image.startsWith('data:image/')) {
      if (image.length > MAX_IMAGE_BYTES * 1.4) {
        return NextResponse.json({ error: 'Image is too large (max 512KB).' }, { status: 400 })
      }
      user.image = image
    } else if (image.startsWith('/')) {
      user.image = image
    } else {
      return NextResponse.json({ error: 'Unsupported image format.' }, { status: 400 })
    }
  }

  // Notification preferences (whitelist known boolean keys).
  if (notifyPrefs && typeof notifyPrefs === 'object') {
    const current = user.notifyPrefs ?? { ...defaultNotificationPrefs }
    const next: NotificationPrefs = {
      bookingEmails:
        typeof notifyPrefs.bookingEmails === 'boolean'
          ? notifyPrefs.bookingEmails
          : current.bookingEmails,
      reservationEmails:
        typeof notifyPrefs.reservationEmails === 'boolean'
          ? notifyPrefs.reservationEmails
          : current.reservationEmails,
      promoEmails:
        typeof notifyPrefs.promoEmails === 'boolean' ? notifyPrefs.promoEmails : current.promoEmails,
    }
    user.notifyPrefs = next
  }

  if (newPassword) {
    if (!currentPassword || !verifyPassword(String(currentPassword), user.salt, user.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }
    const pwError = validatePassword(newPassword)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }
    const { salt, passwordHash } = hashPassword(String(newPassword))
    user.salt = salt
    user.passwordHash = passwordHash
  }

  persist()
  return NextResponse.json({ user: toPublic(user) })
}
