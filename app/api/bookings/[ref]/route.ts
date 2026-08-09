import { NextResponse } from 'next/server'
import { db, persistDurable } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import { sendBookingEmail } from '@/lib/email/mailer'
import { isStaffRole } from '@/lib/db/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params
  // getCurrentUser() hydrates durable state and identifies the caller.
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const booking = db.bookings.find((b) => b.ref === ref)
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  // Authorization: only the owning customer (by account id or matching verified
  // email) or a staff member may read a booking's full details. This prevents an
  // IDOR where anyone guessing a reference could read another guest's PII.
  const owns =
    booking.userId === user.id ||
    (!!user.email && booking.guestEmail?.toLowerCase() === user.email.toLowerCase())
  if (!owns && !isStaffRole(user.role)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  return NextResponse.json({ booking })
}

// PATCH — cancel a booking. Only the authenticated owner may cancel, and only
// while the stay hasn't started and the booking is in a cancellable state.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { action } = await req.json().catch(() => ({}))
  if (action !== 'cancel') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const booking = db.bookings.find((b) => b.ref === ref)
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  // Server-side authorization: the booking must belong to this user.
  const ownsBooking =
    booking.userId === user.id ||
    (!!user.email && booking.guestEmail?.toLowerCase() === user.email)
  if (!ownsBooking) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  // Business rules: cannot cancel after check-in / completion / prior cancel.
  const nonCancellable = ['checked_in', 'checked_out', 'completed', 'cancelled', 'no_show']
  if (nonCancellable.includes(booking.status)) {
    return NextResponse.json(
      { error: 'This booking can no longer be cancelled online. Please contact the hotel.' },
      { status: 400 },
    )
  }
  const today = new Date().toISOString().split('T')[0]
  if (booking.checkIn <= today) {
    return NextResponse.json(
      { error: 'Cancellation window has passed. Please contact the hotel for assistance.' },
      { status: 400 },
    )
  }

  booking.status = 'cancelled'
  // Free any assigned physical rooms so inventory stays consistent.
  if (booking.roomNumbers?.length) {
    for (const num of booking.roomNumbers) {
      const pr = db.physicalRooms.find((p) => p.number === num)
      if (pr && pr.currentBookingId === booking.id) {
        pr.status = 'available'
        pr.currentBookingId = undefined
        pr.updatedAt = Date.now()
      }
    }
  }
  await persistDurable()

  if (booking.userId) {
    notify(
      booking.userId,
      'Booking cancelled',
      `Your booking ${booking.ref} for ${booking.roomName} (${booking.checkIn} → ${booking.checkOut}) has been cancelled.`,
      'booking',
    )
  }

  try {
    await sendBookingEmail(booking, 'cancelled')
  } catch (err) {
    console.log('[v0] Cancellation email failed:', err instanceof Error ? err.message : 'unknown')
  }

  return NextResponse.json({ ok: true, booking })
}
