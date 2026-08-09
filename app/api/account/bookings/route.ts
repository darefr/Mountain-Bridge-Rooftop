import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { userBookings } from '@/lib/booking'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  return NextResponse.json({ bookings: userBookings(user.id) })
}
