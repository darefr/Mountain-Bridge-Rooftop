import { NextResponse } from 'next/server'
import { db, persistDurable, uid, makeRef, ensureLoaded } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { quote, unitsAvailable, nightsBetween } from '@/lib/booking'
import { notify, notifyStaff } from '@/lib/notify'
import { sendBookingEmail } from '@/lib/email/mailer'
import type { Booking } from '@/lib/db/types'

export async function POST(req: Request) {
  await ensureLoaded()
  const body = await req.json().catch(() => ({}))
  const {
    roomSlug,
    checkIn,
    checkOut,
    rooms = 1,
    guests = 2,
    currency = 'USD',
    couponCode,
    guestName,
    guestEmail,
    guestPhone,
    paymentMethod, // 'pay_at_hotel' | 'esewa' | 'khalti' | 'fonepay'
  } = body

  const room = db.rooms.find((r) => r.slug === roomSlug)
  if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 400 })
  if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: 'Invalid dates.' }, { status: 400 })
  }
  if (!guestName || !guestEmail) {
    return NextResponse.json({ error: 'Guest name and email are required.' }, { status: 400 })
  }

  const roomsWanted = Math.max(1, Number(rooms) || 1)
  const guestCount = Math.max(1, Number(guests) || 2)

  // Capacity: total guests must fit within the requested room units.
  if (guestCount > room.maxGuests * roomsWanted) {
    return NextResponse.json(
      {
        error: `Up to ${room.maxGuests} guests per room. Please add rooms or reduce guests.`,
        code: 'OVER_CAPACITY',
      },
      { status: 400 },
    )
  }

  // Double-booking prevention: re-check availability at commit time.
  if (unitsAvailable(roomSlug, checkIn, checkOut) < roomsWanted) {
    return NextResponse.json(
      { error: 'This room was just booked for those dates. Please choose another.', code: 'SOLD_OUT' },
      { status: 409 },
    )
  }

  const cur = currency === 'NPR' ? 'NPR' : 'USD'
  const q = quote({ roomSlug, checkIn, checkOut, rooms: roomsWanted, currency: cur, couponCode })

  const user = await getCurrentUser()
  const payAtHotel = paymentMethod === 'pay_at_hotel' || !paymentMethod

  const booking: Booking = {
    id: uid(),
    ref: makeRef('MB'),
    userId: user?.id,
    roomSlug,
    roomName: room.name,
    checkIn,
    checkOut,
    nights: q.nights,
    rooms: roomsWanted,
    guests: guestCount,
    currency: cur,
    subtotal: q.subtotal,
    tax: q.tax + q.service,
    discount: q.discount,
    total: q.total,
    couponCode: q.couponCode,
    status: payAtHotel ? 'confirmed' : 'pending',
    paymentStatus: payAtHotel ? 'unpaid' : 'pending',
    paymentMethod: paymentMethod || 'pay_at_hotel',
    guestName,
    guestEmail,
    guestPhone,
    createdAt: Date.now(),
  }

  db.bookings.push(booking)
  await persistDurable()

  notifyStaff(
    'New booking',
    `${booking.ref} · ${booking.guestName} · ${room.name} (${checkIn} → ${checkOut}) · ${booking.total} ${booking.currency}`,
    'booking',
  )

  if (user) {
    notify(
      user.id,
      payAtHotel ? 'Booking confirmed' : 'Booking created',
      `Your ${room.name} booking (${booking.ref}) for ${checkIn} → ${checkOut} is ${booking.status}.`,
      'booking',
    )
  }

  // Transactional email to the guest (best-effort; never blocks the booking).
  try {
    await sendBookingEmail(booking, payAtHotel ? 'confirmed' : 'created')
  } catch (err) {
    console.log('[v0] Booking email failed:', err instanceof Error ? err.message : 'unknown')
  }

  return NextResponse.json({ booking })
}
