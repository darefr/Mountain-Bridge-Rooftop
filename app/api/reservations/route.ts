import { NextResponse } from 'next/server'
import { db, persistDurable, uid, makeRef, ensureLoaded } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify, notifyStaff } from '@/lib/notify'
import { sendReservationEmail } from '@/lib/email/mailer'
import { findTableFor, largestTableSeats, availableSlots, MAX_PARTY_SIZE } from '@/lib/restaurant'
import type { Reservation } from '@/lib/db/types'

// GET /api/reservations?date=YYYY-MM-DD&guests=N — which slots are still open.
export async function GET(req: Request) {
  await ensureLoaded()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? ''
  const guests = Math.max(1, Number(searchParams.get('guests')) || 2)
  if (!date) return NextResponse.json({ slots: [] })
  return NextResponse.json({ slots: availableSlots(date, guests) })
}

export async function POST(req: Request) {
  await ensureLoaded()
  const body = await req.json().catch(() => ({}))
  const { date, time, guests, name, phone, email, requests } = body

  if (!name || !phone || !date || !time) {
    return NextResponse.json(
      { error: 'Name, phone, date and time are required.' },
      { status: 400 },
    )
  }

  const partySize = Math.max(1, Number(guests) || 2)

  // Party too large for any single table — hand off to WhatsApp / front desk.
  if (partySize > Math.max(MAX_PARTY_SIZE, largestTableSeats())) {
    return NextResponse.json(
      {
        error: `For parties larger than ${largestTableSeats()} we arrange seating personally — please contact us.`,
        code: 'PARTY_TOO_LARGE',
      },
      { status: 400 },
    )
  }

  // Real availability: find a free, suitably sized table for this window.
  const table = findTableFor(date, time, partySize)
  if (!table) {
    const alternatives = availableSlots(date, partySize)
    return NextResponse.json(
      {
        error: 'No table is available for that time. Please choose another slot.',
        code: 'FULLY_BOOKED',
        alternatives,
      },
      { status: 409 },
    )
  }

  const user = await getCurrentUser()

  const reservation: Reservation = {
    id: uid(),
    ref: makeRef('RES'),
    userId: user?.id,
    date,
    time,
    guests: partySize,
    name,
    phone,
    email,
    requests,
    tableId: table.id,
    status: 'confirmed',
    createdAt: Date.now(),
  }

  db.reservations.push(reservation)
  await persistDurable()

  notifyStaff(
    'New restaurant reservation',
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
    console.log('[v0] Reservation email failed:', err instanceof Error ? err.message : 'unknown')
  }

  return NextResponse.json({ reservation, table: { name: table.name, location: table.location } })
}
