import { NextResponse } from 'next/server'
import { db, persistDurable, uid } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { unitsAvailable, nightsBetween } from '@/lib/booking'
import { notify, notifyStaff } from '@/lib/notify'
import type { Booking, BookingChangeRequest, ChangeRequestType } from '@/lib/db/types'

const MODIFIABLE_STATUSES = new Set(['pending', 'confirmed'])
const VALID_TYPES: ChangeRequestType[] = ['dates', 'room', 'guests', 'other']

// A booking the current user owns (by account id, or by matching verified email
// for bookings created before login).
function ownedBooking(user: { id: string; email: string }, ref: string): Booking | undefined {
  const booking = db.bookings.find((b) => b.ref === ref)
  if (!booking) return undefined
  const owns =
    booking.userId === user.id ||
    (!!user.email && booking.guestEmail?.toLowerCase() === user.email.toLowerCase())
  return owns ? booking : undefined
}

// GET — list the current user's change requests (optionally filtered by booking).
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  let list = db.changeRequests.filter((c) => c.userId === user.id)
  if (ref) list = list.filter((c) => c.bookingRef === ref)
  list = [...list].sort((a, b) => b.createdAt - a.createdAt)

  return NextResponse.json({ changeRequests: list })
}

// POST — create a change request for an owned booking.
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ref = String(body.ref || '')
  const type = String(body.type || '') as ChangeRequestType
  const message = body.message ? String(body.message).slice(0, 1000) : undefined

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid change type.' }, { status: 400 })
  }

  const booking = ownedBooking(user, ref)
  if (!booking) {
    // Do not distinguish "not found" from "not yours" — avoids leaking whether a
    // reference exists for another guest.
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  if (!MODIFIABLE_STATUSES.has(booking.status)) {
    return NextResponse.json(
      { error: 'This booking can no longer be changed online. Please contact the hotel.' },
      { status: 400 },
    )
  }
  const today = new Date().toISOString().split('T')[0]
  if (booking.checkIn <= today) {
    return NextResponse.json(
      { error: 'The change window has passed. Please contact the hotel for assistance.' },
      { status: 400 },
    )
  }

  // One open request per booking to prevent spam / conflicting reviews.
  if (db.changeRequests.some((c) => c.bookingId === booking.id && c.status === 'pending')) {
    return NextResponse.json(
      { error: 'You already have a pending change request for this booking.' },
      { status: 409 },
    )
  }

  const room = db.rooms.find((r) => r.slug === booking.roomSlug)

  // Build the request per type, validating the requested values.
  const cr: BookingChangeRequest = {
    id: uid(),
    bookingId: booking.id,
    bookingRef: booking.ref,
    userId: user.id,
    type,
    status: 'pending',
    message,
    createdAt: Date.now(),
    fromCheckIn: booking.checkIn,
    fromCheckOut: booking.checkOut,
    fromRoomSlug: booking.roomSlug,
    fromRoomName: booking.roomName,
    fromGuests: booking.guests,
  }

  if (type === 'dates') {
    const checkIn = String(body.checkIn || '')
    const checkOut = String(body.checkOut || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      return NextResponse.json({ error: 'Please provide valid dates.' }, { status: 400 })
    }
    if (checkIn <= today) {
      return NextResponse.json({ error: 'Check-in must be in the future.' }, { status: 400 })
    }
    if (nightsBetween(checkIn, checkOut) < 1) {
      return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 })
    }
    // Availability for the SAME room over the new dates, excluding this booking.
    if (unitsAvailable(booking.roomSlug, checkIn, checkOut, booking.id) < booking.rooms) {
      return NextResponse.json(
        { error: 'That room is not available for the requested dates.' },
        { status: 409 },
      )
    }
    if (checkIn === booking.checkIn && checkOut === booking.checkOut) {
      return NextResponse.json({ error: 'The requested dates match your current booking.' }, { status: 400 })
    }
    cr.checkIn = checkIn
    cr.checkOut = checkOut
  } else if (type === 'room') {
    const roomSlug = String(body.roomSlug || '')
    const newRoom = db.rooms.find((r) => r.slug === roomSlug && r.active !== false)
    if (!newRoom) return NextResponse.json({ error: 'Selected room is unavailable.' }, { status: 400 })
    if (roomSlug === booking.roomSlug) {
      return NextResponse.json({ error: 'That is already your booked room.' }, { status: 400 })
    }
    if (booking.guests > newRoom.maxGuests * booking.rooms) {
      return NextResponse.json(
        { error: `The ${newRoom.name} holds up to ${newRoom.maxGuests} guests per room.` },
        { status: 400 },
      )
    }
    if (unitsAvailable(roomSlug, booking.checkIn, booking.checkOut, booking.id) < booking.rooms) {
      return NextResponse.json(
        { error: 'That room is not available for your dates.' },
        { status: 409 },
      )
    }
    cr.roomSlug = roomSlug
    cr.roomName = newRoom.name
  } else if (type === 'guests') {
    const guests = Math.floor(Number(body.guests))
    if (!Number.isFinite(guests) || guests < 1) {
      return NextResponse.json({ error: 'Please provide a valid guest count.' }, { status: 400 })
    }
    const cap = (room?.maxGuests ?? booking.guests) * booking.rooms
    if (guests > cap) {
      return NextResponse.json(
        { error: `Up to ${cap} guests for this booking. Add rooms or reduce guests.` },
        { status: 400 },
      )
    }
    if (guests === booking.guests) {
      return NextResponse.json({ error: 'That matches your current guest count.' }, { status: 400 })
    }
    cr.guests = guests
  } else {
    // 'other' — free-text request requires a message.
    if (!message) {
      return NextResponse.json({ error: 'Please describe the change you need.' }, { status: 400 })
    }
  }

  db.changeRequests.push(cr)
  await persistDurable()

  notifyStaff(
    'Booking change requested',
    `${booking.ref} · ${booking.guestName} requested a ${type} change.`,
    'booking',
  )
  notify(
    user.id,
    'Change request submitted',
    `We received your request to change booking ${booking.ref}. Our team will review it shortly.`,
    'booking',
  )

  return NextResponse.json({ ok: true, changeRequest: cr })
}

// PATCH — the customer withdraws their own pending change request.
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id, action } = await req.json().catch(() => ({}))
  if (action !== 'cancel') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const cr = db.changeRequests.find((c) => c.id === id)
  if (!cr || cr.userId !== user.id) {
    return NextResponse.json({ error: 'Change request not found.' }, { status: 404 })
  }
  if (cr.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be withdrawn.' }, { status: 400 })
  }

  cr.status = 'cancelled'
  cr.resolvedAt = Date.now()
  await persistDurable()

  return NextResponse.json({ ok: true, changeRequest: cr })
}
