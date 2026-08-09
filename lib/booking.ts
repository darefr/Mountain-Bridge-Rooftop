import { db } from '@/lib/db/store'
import type { Booking, Coupon } from '@/lib/db/types'

export const USD_TO_NPR = 133
export const TAX_RATE = 0.13 // Nepal VAT 13%
export const SERVICE_RATE = 0.1 // 10% service charge

export function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + 'T00:00:00')
  const b = new Date(checkOut + 'T00:00:00')
  const ms = b.getTime() - a.getTime()
  return Math.max(0, Math.round(ms / 86400000))
}

// How many units of a room are already committed for a date range.
function overlappingUnits(roomSlug: string, checkIn: string, checkOut: string, ignoreId?: string) {
  return db.bookings
    .filter(
      (b) =>
        b.roomSlug === roomSlug &&
        b.id !== ignoreId &&
        b.status !== 'cancelled' &&
        // overlap test: existing.checkIn < new.checkOut && existing.checkOut > new.checkIn
        b.checkIn < checkOut &&
        b.checkOut > checkIn,
    )
    .reduce((sum, b) => sum + b.rooms, 0)
}

// Units taken out of inventory by manual admin blocks (maintenance, closure,
// private booking) that overlap the requested range.
export function blockedUnits(roomSlug: string, checkIn: string, checkOut: string) {
  return (db.roomBlocks ?? [])
    .filter((b) => b.roomSlug === roomSlug && b.start < checkOut && b.end > checkIn)
    .reduce((sum, b) => sum + (b.units || 0), 0)
}

export function unitsAvailable(roomSlug: string, checkIn: string, checkOut: string, ignoreId?: string) {
  const room = db.rooms.find((r) => r.slug === roomSlug)
  if (!room) return 0
  const used = overlappingUnits(roomSlug, checkIn, checkOut, ignoreId)
  const blocked = blockedUnits(roomSlug, checkIn, checkOut)
  return Math.max(0, room.totalUnits - used - blocked)
}

export type AvailabilityRow = {
  slug: string
  name: string
  image: string
  priceUSD: number
  maxGuests: number
  totalUnits: number
  available: number
}

export function availability(checkIn: string, checkOut: string): AvailabilityRow[] {
  return db.rooms
    .filter((r) => r.active !== false)
    .map((r) => ({
    slug: r.slug,
    name: r.name,
    image: r.image,
    priceUSD: r.priceUSD,
    maxGuests: r.maxGuests,
    totalUnits: r.totalUnits,
    available: unitsAvailable(r.slug, checkIn, checkOut),
  }))
}

export function findCoupon(code?: string): Coupon | null {
  if (!code) return null
  const c = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active)
  return c ?? null
}

export type Quote = {
  currency: 'USD' | 'NPR'
  nights: number
  rooms: number
  nightlyUSD: number
  roomTotalUSD: number
  subtotal: number
  tax: number
  service: number
  discount: number
  total: number
  couponCode?: string
  couponValid: boolean
  couponMessage?: string
}

export function quote(opts: {
  roomSlug: string
  checkIn: string
  checkOut: string
  rooms: number
  currency?: 'USD' | 'NPR'
  couponCode?: string
}): Quote {
  const currency = opts.currency ?? 'USD'
  const room = db.rooms.find((r) => r.slug === opts.roomSlug)
  const nights = nightsBetween(opts.checkIn, opts.checkOut)
  const roomsN = Math.max(1, opts.rooms || 1)
  const nightlyUSD = room?.priceUSD ?? 0
  const roomTotalUSD = nightlyUSD * nights * roomsN

  const conv = (usd: number) => (currency === 'NPR' ? Math.round(usd * USD_TO_NPR) : usd)

  let subtotal = roomTotalUSD
  let discount = 0
  let couponValid = false
  let couponMessage: string | undefined

  const coupon = findCoupon(opts.couponCode)
  if (opts.couponCode) {
    const timesUsed = coupon
      ? db.bookings.filter(
          (b) => b.couponCode?.toUpperCase() === coupon.code.toUpperCase() && b.status !== 'cancelled',
        ).length
      : 0
    if (!coupon) {
      couponMessage = 'Coupon not found or inactive.'
    } else if (coupon.minNights && nights < coupon.minNights) {
      couponMessage = `Requires a stay of at least ${coupon.minNights} nights.`
    } else if (coupon.minBookingValueUSD && roomTotalUSD < coupon.minBookingValueUSD) {
      couponMessage = `Requires a booking value of at least $${coupon.minBookingValueUSD}.`
    } else if (coupon.expires && new Date(coupon.expires) < new Date()) {
      couponMessage = 'This coupon has expired.'
    } else if (coupon.usageLimit && timesUsed >= coupon.usageLimit) {
      couponMessage = 'This coupon has reached its usage limit.'
    } else {
      couponValid = true
      discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value
      discount = Math.min(discount, subtotal)
      couponMessage = `Coupon applied — ${coupon.type === 'percent' ? coupon.value + '%' : '$' + coupon.value} off.`
    }
  }

  const taxable = subtotal - discount
  const tax = taxable * TAX_RATE
  const service = taxable * SERVICE_RATE
  const total = taxable + tax + service

  return {
    currency,
    nights,
    rooms: roomsN,
    nightlyUSD: conv(nightlyUSD),
    roomTotalUSD: conv(roomTotalUSD),
    subtotal: conv(subtotal),
    tax: Math.round(conv(tax)),
    service: Math.round(conv(service)),
    discount: Math.round(conv(discount)),
    total: Math.round(conv(total)),
    couponCode: couponValid ? coupon!.code : undefined,
    couponValid,
    couponMessage,
  }
}

export function isDoubleBooked(roomSlug: string, checkIn: string, checkOut: string, roomsWanted: number) {
  return unitsAvailable(roomSlug, checkIn, checkOut) < roomsWanted
}

export function userBookings(userId: string): Booking[] {
  return db.bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

// ---------------------------------------------------------------------------
// PMS helpers — individual physical room assignment (Phase 1/2)
// ---------------------------------------------------------------------------

// Physical rooms of a category that can be assigned to an arriving guest:
// not currently occupied, and not blocked for maintenance/out-of-service.
export function assignablePhysicalRooms(roomSlug: string) {
  return db.physicalRooms.filter(
    (r) =>
      r.roomSlug === roomSlug &&
      r.status !== 'occupied' &&
      r.status !== 'maintenance' &&
      r.status !== 'out_of_service',
  )
}

// Pick `count` free physical rooms for a category, preferring already-clean rooms.
export function pickPhysicalRooms(roomSlug: string, count: number): string[] {
  const pool = assignablePhysicalRooms(roomSlug).sort((a, b) => {
    // clean & available first, then by number
    const score = (x: (typeof pool)[number]) =>
      (x.status === 'available' ? 0 : 1) + (x.housekeeping === 'clean' ? 0 : 0.5)
    return score(a) - score(b) || a.number.localeCompare(b.number)
  })
  return pool.slice(0, count).map((r) => r.number)
}
