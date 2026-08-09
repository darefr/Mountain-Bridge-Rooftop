import { NextResponse } from 'next/server'
import { db, persist } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import { sendReservationEmail } from '@/lib/email/mailer'

function ownsReservation(
  r: { userId?: string; email?: string },
  user: { id: string; email: string },
) {
  return r.userId === user.id || (!!user.email && r.email?.toLowerCase() === user.email)
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  const reservations = db.reservations
    .filter((r) => ownsReservation(r, user))
    .sort((a, b) => b.createdAt - a.createdAt)
  return NextResponse.json({ reservations })
}

// PATCH — cancel one of the current user's restaurant reservations.
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id, action } = await req.json().catch(() => ({}))
  if (action !== 'cancel') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const reservation = db.reservations.find((r) => r.id === id && ownsReservation(r, user))
  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
  }
  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'This reservation is already cancelled.' }, { status: 400 })
  }
  if (reservation.status === 'seated') {
    return NextResponse.json(
      { error: 'This reservation can no longer be cancelled. Please contact the hotel.' },
      { status: 400 },
    )
  }

  reservation.status = 'cancelled'
  // Release the assigned table so the slot frees up.
  reservation.tableId = undefined
  persist()
  notify(
    user.id,
    'Reservation cancelled',
    `Your table reservation ${reservation.ref} on ${reservation.date} at ${reservation.time} has been cancelled.`,
    'reservation',
  )
  try {
    await sendReservationEmail(reservation, 'cancelled')
  } catch (err) {
    console.log('[v0] Reservation cancel email failed:', err instanceof Error ? err.message : 'unknown')
  }

  return NextResponse.json({ ok: true, reservation })
}
