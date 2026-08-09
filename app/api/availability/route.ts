import { NextResponse } from 'next/server'
import { ensureLoaded } from '@/lib/db/store'
import { availability, nightsBetween } from '@/lib/booking'

export async function GET(req: Request) {
  await ensureLoaded()
  const { searchParams } = new URL(req.url)
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''

  if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: 'Please provide valid check-in and check-out dates.' }, { status: 400 })
  }
  return NextResponse.json({
    checkIn,
    checkOut,
    nights: nightsBetween(checkIn, checkOut),
    rooms: availability(checkIn, checkOut),
  })
}
