import { NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { isStaffRole } from '@/lib/db/types'
import type { Booking } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

const USD_TO_NPR = 133
const toUSD = (b: Pick<Booking, 'currency' | 'total'>) =>
  b.currency === 'NPR' ? b.total / USD_TO_NPR : b.total

// Resolve a named range (or explicit from/to) into an inclusive [start,end] ms
// window. All aggregation is done server-side so financial numbers are never
// computed only in the browser.
function resolveRange(range: string, fromStr?: string | null, toStr?: string | null) {
  const now = new Date()
  const endOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x.getTime()
  }
  const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.getTime()
  }
  const daysAgo = (n: number) => {
    const x = new Date(now)
    x.setDate(x.getDate() - n)
    return startOfDay(x)
  }
  switch (range) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case '7d':
      return { start: daysAgo(6), end: endOfDay(now) }
    case '30d':
      return { start: daysAgo(29), end: endOfDay(now) }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: startOfDay(s), end: endOfDay(now) }
    }
    case 'year': {
      const s = new Date(now.getFullYear(), 0, 1)
      return { start: startOfDay(s), end: endOfDay(now) }
    }
    case 'custom': {
      const start = fromStr ? startOfDay(new Date(fromStr + 'T00:00:00')) : daysAgo(29)
      const end = toStr ? endOfDay(new Date(toStr + 'T00:00:00')) : endOfDay(now)
      return { start, end }
    }
    default:
      return { start: daysAgo(29), end: endOfDay(now) }
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const range = url.searchParams.get('range') ?? '30d'
  const { start, end } = resolveRange(range, url.searchParams.get('from'), url.searchParams.get('to'))

  const inRange = db.bookings.filter((b) => b.createdAt >= start && b.createdAt <= end)

  // --- Revenue analytics ---
  const paid = inRange.filter((b) => b.paymentStatus === 'paid')
  const pending = inRange.filter(
    (b) => b.paymentStatus === 'unpaid' || b.paymentStatus === 'pending' || b.paymentStatus === 'partial',
  )
  const refunded = inRange.filter((b) => b.paymentStatus === 'refunded')

  const paidRevenue = Math.round(paid.reduce((s, b) => s + toUSD(b), 0))
  const pendingRevenue = Math.round(pending.reduce((s, b) => s + toUSD(b), 0))
  const refundedRevenue = Math.round(
    refunded.reduce((s, b) => s + (b.refundAmount ? (b.currency === 'NPR' ? b.refundAmount / USD_TO_NPR : b.refundAmount) : toUSD(b)), 0),
  )
  const totalRevenue = paidRevenue
  const avgBookingValue = paid.length ? Math.round(paidRevenue / paid.length) : 0

  // --- Booking analytics ---
  const byStatus = (s: Booking['status']) => inRange.filter((b) => b.status === s).length
  const bookingStats = {
    total: inRange.length,
    confirmed: byStatus('confirmed'),
    pending: byStatus('pending'),
    cancelled: byStatus('cancelled'),
    completed: inRange.filter((b) => b.status === 'completed' || b.status === 'checked_out').length,
    paymentPending: pending.length,
  }

  // --- Time series (bookings + revenue over time), bucketed by day ---
  const dayKey = (ms: number) => new Date(ms).toISOString().split('T')[0]
  const spanDays = Math.max(1, Math.round((end - start) / 86400000))
  const series: { date: string; bookings: number; revenue: number }[] = []
  const bucket = new Map<string, { bookings: number; revenue: number }>()
  for (const b of inRange) {
    const k = dayKey(b.createdAt)
    const cur = bucket.get(k) ?? { bookings: 0, revenue: 0 }
    cur.bookings += 1
    if (b.paymentStatus === 'paid') cur.revenue += toUSD(b)
    bucket.set(k, cur)
  }
  // Build a continuous axis so charts don't have gaps (cap at ~90 buckets).
  const step = spanDays > 90 ? Math.ceil(spanDays / 90) : 1
  for (let i = 0; i <= spanDays; i += step) {
    const d = new Date(start + i * 86400000)
    const k = d.toISOString().split('T')[0]
    const v = bucket.get(k) ?? { bookings: 0, revenue: 0 }
    series.push({ date: k, bookings: v.bookings, revenue: Math.round(v.revenue) })
  }

  // --- Room popularity ---
  const roomPop = db.rooms.map((r) => ({
    slug: r.slug,
    name: r.name,
    bookings: inRange.filter((b) => b.roomSlug === r.slug).length,
    revenue: Math.round(
      inRange.filter((b) => b.roomSlug === r.slug && b.paymentStatus === 'paid').reduce((s, b) => s + toUSD(b), 0),
    ),
  }))

  // --- Payment method distribution ---
  const methodMap = new Map<string, number>()
  for (const b of inRange) {
    const m = b.paymentMethod || (b.paymentStatus === 'unpaid' ? 'pay_at_hotel' : 'unknown')
    methodMap.set(m, (methodMap.get(m) ?? 0) + 1)
  }
  const paymentMethods = [...methodMap.entries()].map(([method, count]) => ({ method, count }))

  // --- Booking source distribution ---
  const sourceMap = new Map<string, number>()
  for (const b of inRange) {
    const s = b.source || 'online'
    sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1)
  }
  const sources = [...sourceMap.entries()].map(([source, count]) => ({ source, count }))

  // --- Occupancy analytics (room-nights sold vs. capacity in range) ---
  const totalUnits = db.rooms.reduce((s, r) => s + r.totalUnits, 0)
  const rangeNights = spanDays
  const capacity = totalUnits * rangeNights
  // Room-nights actually sold that overlap the window.
  let soldNights = 0
  const perRoomNights = new Map<string, number>()
  for (const b of db.bookings) {
    if (b.status === 'cancelled' || b.status === 'no_show') continue
    const ci = new Date(b.checkIn + 'T00:00:00').getTime()
    const co = new Date(b.checkOut + 'T00:00:00').getTime()
    const overlapStart = Math.max(ci, start)
    const overlapEnd = Math.min(co, end)
    if (overlapEnd > overlapStart) {
      const nights = Math.round((overlapEnd - overlapStart) / 86400000) * b.rooms
      soldNights += nights
      perRoomNights.set(b.roomSlug, (perRoomNights.get(b.roomSlug) ?? 0) + nights)
    }
  }
  const occupancy = {
    rate: capacity ? Math.round((soldNights / capacity) * 100) : 0,
    soldNights,
    capacity,
    perRoom: db.rooms.map((r) => ({
      slug: r.slug,
      name: r.name,
      rate: r.totalUnits * rangeNights ? Math.round(((perRoomNights.get(r.slug) ?? 0) / (r.totalUnits * rangeNights)) * 100) : 0,
    })),
  }

  return NextResponse.json({
    range,
    start,
    end,
    revenue: { total: totalRevenue, paid: paidRevenue, pending: pendingRevenue, refunded: refundedRevenue, avgBookingValue },
    bookings: bookingStats,
    series,
    roomPopularity: roomPop.sort((a, b) => b.bookings - a.bookings),
    paymentMethods,
    sources,
    occupancy,
  })
}
