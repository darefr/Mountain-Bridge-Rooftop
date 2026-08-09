import { NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  // Only payments tied to bookings owned by this user.
  const myBookingIds = new Set(db.bookings.filter((b) => b.userId === user.id).map((b) => b.id))
  const payments = db.payments
    .filter((p) => myBookingIds.has(p.bookingId))
    .map((p) => {
      const booking = db.bookings.find((b) => b.id === p.bookingId)
      return {
        id: p.id,
        provider: p.provider,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
        bookingRef: booking?.ref,
        roomName: booking?.roomName,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  return NextResponse.json({ payments })
}
