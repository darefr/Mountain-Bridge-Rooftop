import { NextResponse } from 'next/server'
import { ensureLoaded } from '@/lib/db/store'
import { quote } from '@/lib/booking'

export async function POST(req: Request) {
  await ensureLoaded()
  const body = await req.json().catch(() => ({}))
  const { roomSlug, checkIn, checkOut, rooms, currency, couponCode } = body
  if (!roomSlug || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing booking details.' }, { status: 400 })
  }
  const q = quote({
    roomSlug,
    checkIn,
    checkOut,
    rooms: Number(rooms) || 1,
    currency: currency === 'NPR' ? 'NPR' : 'USD',
    couponCode,
  })
  return NextResponse.json({ quote: q })
}
