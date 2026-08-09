import 'server-only'
import { db, persistDurable, uid, makeRef } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify, notifyStaff } from '@/lib/notify'
import { sendReservationEmail } from '@/lib/email/mailer'
import { findTableFor, availableSlots, largestTableSeats, MAX_PARTY_SIZE } from '@/lib/restaurant'
import type { Reservation } from '@/lib/db/types'

export type ReservationActionInput = {
  date: string
  time: string
  guests: number
  name: string
  phone: string
  email?: string
  requests?: string
}

export type ReservationActionResult =
  | {
      ok: true
      ref: string
      date: string
      time: string
      guests: number
      name: string
      tableName: string
      tableLocation?: string
    }
  | {
      ok: false
      error: string
      code: 'MISSING' | 'PARTY_TOO_LARGE' | 'FULLY_BOOKED'
      alternatives?: string[]
    }

// Shared server-side reservation creator used by the AI concierge tool. Mirrors
// the validation in /api/reservations so availability rules stay identical, but
// lives separately so the public route keeps working untouched.
export async function createReservationFromAI(
  input: ReservationActionInput,
): Promise<ReservationActionResult> {
  const { date, time, name, phone } = input
  if (!name || !phone || !date || !time) {
    return { ok: false, code: 'MISSING', error: 'Name, phone, date and time are all required.' }
  }

  const partySize = Math.max(1, Number(input.guests) || 2)

  if (partySize > Math.max(MAX_PARTY_SIZE, largestTableSeats())) {
    return {
      ok: false,
      code: 'PARTY_TOO_LARGE',
      error: `For parties larger than ${largestTableSeats()} we arrange seating personally — please continue on WhatsApp.`,
    }
  }

  const table = findTableFor(date, time, partySize)
  if (!table) {
    return {
      ok: false,
      code: 'FULLY_BOOKED',
      error: 'No table is free for that time.',
      alternatives: availableSlots(date, partySize),
    }
  }

  const user = await getCurrentUser().catch(() => null)

  const reservation: Reservation = {
    id: uid(),
    ref: makeRef('RES'),
    userId: user?.id,
    date,
    time,
    guests: partySize,
    name,
    phone,
    email: input.email,
    requests: input.requests,
    tableId: table.id,
    status: 'confirmed',
    createdAt: Date.now(),
  }

  db.reservations.push(reservation)
  await persistDurable()

  notifyStaff(
    'New restaurant reservation (via concierge)',
    `${reservation.ref} · ${name} · party of ${partySize} · ${date} ${time} · ${table.name}`,
    'reservation',
  )
  if (user) {
    notify(
      user.id,
      'Table reserved',
      `Your rooftop table (${table.name}) for ${partySize} on ${date} at ${time} is confirmed (${reservation.ref}).`,
      'reservation',
    )
  }

  try {
    await sendReservationEmail(reservation, 'confirmed', table.name)
  } catch (err) {
    console.log('[v0] Concierge reservation email failed:', err instanceof Error ? err.message : 'unknown')
  }

  return {
    ok: true,
    ref: reservation.ref,
    date,
    time,
    guests: partySize,
    name,
    tableName: table.name,
    tableLocation: table.location,
  }
}
