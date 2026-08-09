import { NextResponse } from 'next/server'
import { db, persistDurable, uid, makeRef, audit } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import { pickPhysicalRooms, quote, unitsAvailable, nightsBetween } from '@/lib/booking'
import { isStaffRole, isManagerRole } from '@/lib/db/types'
import { sendBookingEmail } from '@/lib/email/mailer'
import type { RoomOpStatus, HousekeepingState, Role, RoomBlockReason } from '@/lib/db/types'

// Actions that require full management privileges (finance/staff/settings).
const MANAGER_ONLY = new Set([
  'staff.create',
  'staff.remove',
  'staff.update',
  'staff.setRole',
  'coupon.create',
  'coupon.update',
  'coupon.toggle',
  'coupon.remove',
  'room.create',
  'room.update',
  'room.remove',
  'room.toggle',
  'roomBlock.create',
  'roomBlock.remove',
  'seasonalRate.create',
  'seasonalRate.toggle',
  'seasonalRate.remove',
  'addon.create',
  'addon.toggle',
  'addon.remove',
  'table.create',
  'table.update',
  'table.remove',
  'menu.create',
  'menu.update',
  'menu.remove',
  'offer.create',
  'offer.update',
  'offer.remove',
  'review.delete',
  'payment.reconcile',
  'booking.refund',
  'settings.update',
  'emailTemplate.update',
  'gallery.create',
  'gallery.update',
  'gallery.remove',
  'gallery.toggle',
  'gallery.reorder',
  'faq.create',
  'faq.update',
  'faq.remove',
  'faq.toggle',
  'faq.reorder',
  'review.edit',
  'review.feature',
])

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isStaffRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, id, payload } = await req.json().catch(() => ({}))

  if (MANAGER_ONLY.has(action) && !isManagerRole(user.role)) {
    return NextResponse.json({ error: 'Requires manager role' }, { status: 403 })
  }

  const actor = { id: user.id, name: user.name }

  switch (action) {
    case 'booking.confirm':
    case 'booking.cancel': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      b.status = action === 'booking.confirm' ? 'confirmed' : 'cancelled'
      // Releasing a cancelled booking frees any assigned rooms.
      if (b.status === 'cancelled' && b.roomNumbers?.length) {
        for (const num of b.roomNumbers) {
          const pr = db.physicalRooms.find((r) => r.number === num)
          if (pr && pr.currentBookingId === b.id) {
            pr.status = 'available'
            pr.currentBookingId = undefined
            pr.updatedAt = Date.now()
          }
        }
      }
      audit(actor, action, b.ref)
      if (b.userId) notify(b.userId, 'Booking update', `Your booking ${b.ref} is now ${b.status}.`, 'booking')
      break
    }
    case 'booking.markPaid': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      b.paymentStatus = 'paid'
      b.amountPaid = b.total
      if (b.status === 'pending') b.status = 'confirmed'
      audit(actor, 'booking.markPaid', b.ref, `total ${b.total} ${b.currency}`)
      break
    }
    case 'booking.checkIn': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      // Assign physical rooms if not already assigned.
      if (!b.roomNumbers?.length) {
        const picked = pickPhysicalRooms(b.roomSlug, b.rooms)
        if (picked.length < b.rooms) {
          return NextResponse.json(
            { error: `Only ${picked.length} physical room(s) free for ${b.roomName}.` },
            { status: 409 },
          )
        }
        b.roomNumbers = picked
      }
      for (const num of b.roomNumbers) {
        const pr = db.physicalRooms.find((r) => r.number === num)
        if (pr) {
          pr.status = 'occupied'
          pr.currentBookingId = b.id
          pr.updatedAt = Date.now()
        }
      }
      b.status = 'checked_in'
      b.checkedInAt = Date.now()
      audit(actor, 'booking.checkIn', b.ref, `rooms ${b.roomNumbers.join(', ')}`)
      if (b.userId) notify(b.userId, 'Welcome!', `You are checked in to ${b.roomName} (${b.roomNumbers.join(', ')}).`, 'booking')
      break
    }
    case 'booking.checkOut': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      for (const num of b.roomNumbers ?? []) {
        const pr = db.physicalRooms.find((r) => r.number === num)
        if (pr && pr.currentBookingId === b.id) {
          pr.status = 'cleaning'
          pr.housekeeping = 'dirty'
          pr.currentBookingId = undefined
          pr.updatedAt = Date.now()
          // Auto-create a cleaning task for housekeeping.
          db.housekeepingTasks.push({
            id: uid(),
            roomNumber: pr.number,
            type: 'cleaning',
            priority: 'normal',
            status: 'pending',
            note: `Turnover after ${b.ref}`,
            createdAt: Date.now(),
          })
        }
      }
      b.status = 'checked_out'
      b.checkedOutAt = Date.now()
      audit(actor, 'booking.checkOut', b.ref)
      break
    }
    case 'booking.noShow': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      b.status = 'no_show'
      for (const num of b.roomNumbers ?? []) {
        const pr = db.physicalRooms.find((r) => r.number === num)
        if (pr && pr.currentBookingId === b.id) {
          pr.status = 'available'
          pr.currentBookingId = undefined
          pr.updatedAt = Date.now()
        }
      }
      audit(actor, 'booking.noShow', b.ref)
      break
    }
    case 'booking.note': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.staffNotes != null) b.staffNotes = String(payload.staffNotes).slice(0, 1000)
      if (payload?.guestNotes != null) b.guestNotes = String(payload.guestNotes).slice(0, 1000)
      break
    }
    case 'booking.sendEmail': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const kindMap: Record<string, 'created' | 'confirmed' | 'payment_received' | 'cancelled'> = {
        confirmation: b.status === 'confirmed' ? 'confirmed' : 'created',
        payment: 'payment_received',
        cancellation: 'cancelled',
      }
      const kind = kindMap[payload?.kind as string] ?? 'confirmed'
      const res = await sendBookingEmail(b, kind).catch(() => ({ delivered: false }))
      audit(actor, 'booking.sendEmail', b.ref, kind)
      return NextResponse.json({ ok: true, delivered: res.delivered })
    }
    case 'booking.refund': {
      const b = db.bookings.find((x) => x.id === id)
      if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const amt = Number(payload?.amount)
      if (!Number.isFinite(amt) || amt <= 0 || amt > b.total) {
        return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
      }
      b.refundAmount = (b.refundAmount ?? 0) + amt
      b.paymentStatus = 'refunded'
      // Mirror onto any linked payment records.
      for (const p of db.payments.filter((x) => x.bookingId === b.id)) p.status = 'refunded'
      audit(actor, 'booking.refund', b.ref, `${amt} ${b.currency}`)
      if (b.userId) notify(b.userId, 'Refund issued', `A refund of ${amt} ${b.currency} was issued for ${b.ref}.`, 'payment')
      break
    }
    case 'room.setStatus': {
      const pr = db.physicalRooms.find((r) => r.number === id)
      if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const status = payload?.status as RoomOpStatus
      const allowed: RoomOpStatus[] = ['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service']
      if (!allowed.includes(status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 })
      pr.status = status
      if (status === 'available') pr.housekeeping = 'clean'
      if (status === 'cleaning') pr.housekeeping = 'dirty'
      pr.updatedAt = Date.now()
      audit(actor, 'room.setStatus', pr.number, status)
      break
    }
    case 'room.housekeeping': {
      const pr = db.physicalRooms.find((r) => r.number === id)
      if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const hk = payload?.housekeeping as HousekeepingState
      if (!['clean', 'dirty', 'inspected'].includes(hk)) return NextResponse.json({ error: 'Bad state' }, { status: 400 })
      pr.housekeeping = hk
      // A cleaned/inspected room that was in cleaning becomes available again.
      if ((hk === 'clean' || hk === 'inspected') && pr.status === 'cleaning') pr.status = 'available'
      pr.updatedAt = Date.now()
      break
    }
    case 'hk.create': {
      const pr = db.physicalRooms.find((r) => r.number === payload?.roomNumber)
      if (!pr) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      db.housekeepingTasks.push({
        id: uid(),
        roomNumber: pr.number,
        type: payload?.type === 'maintenance' ? 'maintenance' : 'cleaning',
        priority: ['low', 'normal', 'high'].includes(payload?.priority) ? payload.priority : 'normal',
        status: 'pending',
        note: payload?.note ? String(payload.note).slice(0, 300) : undefined,
        createdAt: Date.now(),
      })
      if (payload?.type === 'maintenance') {
        pr.status = 'maintenance'
        pr.updatedAt = Date.now()
      }
      break
    }
    case 'hk.complete': {
      const task = db.housekeepingTasks.find((x) => x.id === id)
      if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      task.status = 'completed'
      task.completedAt = Date.now()
      const pr = db.physicalRooms.find((r) => r.number === task.roomNumber)
      if (pr) {
        if (task.type === 'cleaning') {
          pr.housekeeping = 'clean'
          if (pr.status === 'cleaning') pr.status = 'available'
        } else if (task.type === 'maintenance' && pr.status === 'maintenance') {
          pr.status = 'available'
        }
        pr.updatedAt = Date.now()
      }
      break
    }
    case 'reservation.confirm':
    case 'reservation.cancel':
    case 'reservation.seated':
    case 'reservation.completed':
    case 'reservation.noShow': {
      const r = db.reservations.find((x) => x.id === id)
      if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const map = {
        'reservation.confirm': 'confirmed',
        'reservation.cancel': 'cancelled',
        'reservation.seated': 'seated',
        'reservation.completed': 'completed',
        'reservation.noShow': 'no_show',
      } as const
      r.status = map[action as keyof typeof map]
      if (r.userId) notify(r.userId, 'Reservation update', `Your table reservation ${r.ref} is now ${r.status}.`, 'reservation')
      break
    }
    case 'reservation.assignTable': {
      const r = db.reservations.find((x) => x.id === id)
      if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const table = db.tables.find((tb) => tb.id === payload?.tableId)
      if (payload?.tableId && !table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })
      r.tableId = payload?.tableId || undefined
      break
    }
    case 'order.status': {
      const o = db.orders.find((x) => x.id === id)
      if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const allowed = ['new', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']
      if (!allowed.includes(payload?.status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 })
      o.status = payload.status
      o.updatedAt = Date.now()
      break
    }
    case 'review.toggle': {
      const rev = db.reviews.find((x) => x.id === id)
      if (!rev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      rev.approved = !rev.approved
      break
    }
    case 'offer.toggle': {
      const o = db.offers.find((x) => x.id === id)
      if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      o.active = !o.active
      break
    }
    case 'addon.toggle': {
      const a = db.addOns.find((x) => x.id === id)
      if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      a.active = !a.active
      break
    }
    case 'seasonalRate.toggle': {
      const s = db.seasonalRates.find((x) => x.id === id)
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      s.active = !s.active
      break
    }
    case 'menu.toggle': {
      const m = db.menuItems.find((x) => x.id === id)
      if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      m.available = !m.available
      break
    }
    case 'coupon.toggle': {
      const c = db.coupons.find((x) => x.code === id)
      if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      c.active = !c.active
      audit(actor, 'coupon.toggle', c.code, c.active ? 'active' : 'inactive')
      break
    }
    case 'coupon.create': {
      if (!payload?.code) return NextResponse.json({ error: 'Code required' }, { status: 400 })
      if (db.coupons.some((c) => c.code.toUpperCase() === payload.code.toUpperCase())) {
        return NextResponse.json({ error: 'Coupon already exists' }, { status: 409 })
      }
      db.coupons.push({
        code: payload.code.toUpperCase(),
        type: payload.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(payload.value) || 0,
        active: true,
        minNights: payload.minNights ? Number(payload.minNights) : undefined,
        minBookingValueUSD: payload.minBookingValueUSD ? Number(payload.minBookingValueUSD) : undefined,
        expires: payload.expires || undefined,
        usageLimit: payload.usageLimit ? Number(payload.usageLimit) : undefined,
        usageCount: 0,
        description: payload.description,
      })
      audit(actor, 'coupon.create', payload.code.toUpperCase())
      break
    }
    case 'coupon.update': {
      const c = db.coupons.find((x) => x.code === id)
      if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.value != null) c.value = Number(payload.value)
      if (payload?.type) c.type = payload.type === 'fixed' ? 'fixed' : 'percent'
      if (payload?.minNights != null) c.minNights = payload.minNights ? Number(payload.minNights) : undefined
      if (payload?.minBookingValueUSD != null) c.minBookingValueUSD = payload.minBookingValueUSD ? Number(payload.minBookingValueUSD) : undefined
      if (payload?.expires != null) c.expires = payload.expires || undefined
      if (payload?.usageLimit != null) c.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : undefined
      if (payload?.description != null) c.description = String(payload.description)
      audit(actor, 'coupon.update', c.code)
      break
    }
    case 'coupon.remove': {
      db.coupons = db.coupons.filter((c) => c.code !== id)
      audit(actor, 'coupon.remove', String(id))
      break
    }
    case 'room.update': {
      const r = db.rooms.find((x) => x.slug === id)
      if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.name != null) r.name = String(payload.name).slice(0, 120)
      if (payload?.priceUSD != null) r.priceUSD = Math.max(0, Number(payload.priceUSD))
      if (payload?.totalUnits != null) r.totalUnits = Math.max(0, Number(payload.totalUnits))
      if (payload?.maxGuests != null) r.maxGuests = Math.max(1, Number(payload.maxGuests))
      if (payload?.description != null) r.description = String(payload.description).slice(0, 2000)
      if (payload?.image != null) r.image = String(payload.image)
      if (payload?.amenities != null) r.amenities = Array.isArray(payload.amenities) ? payload.amenities.map((a: unknown) => String(a)) : String(payload.amenities).split(',').map((s) => s.trim()).filter(Boolean)
      if (payload?.minNights != null) r.minNights = Math.max(1, Number(payload.minNights))
      if (payload?.maxNights != null) r.maxNights = Math.max(1, Number(payload.maxNights))
      audit(actor, 'room.update', r.slug, JSON.stringify(payload))
      break
    }
    case 'room.create': {
      const name = String(payload?.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      const slug = String(payload?.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (db.rooms.some((r) => r.slug === slug)) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      db.rooms.push({
        slug,
        name,
        image: String(payload?.image || '/images/room-valley.png'),
        priceUSD: Math.max(0, Number(payload?.priceUSD) || 50),
        totalUnits: Math.max(0, Number(payload?.totalUnits) || 1),
        maxGuests: Math.max(1, Number(payload?.maxGuests) || 2),
        weekendSurchargePct: 15,
        extraGuestFeeUSD: 8,
        extraBedFeeUSD: 10,
        minNights: 1,
        maxNights: 30,
        description: payload?.description ? String(payload.description).slice(0, 2000) : '',
        amenities: Array.isArray(payload?.amenities) ? payload.amenities.map((a: unknown) => String(a)) : [],
        active: true,
      })
      audit(actor, 'room.create', slug)
      break
    }
    case 'room.toggle': {
      const r = db.rooms.find((x) => x.slug === id)
      if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      r.active = r.active === false ? true : false
      audit(actor, 'room.toggle', r.slug, r.active ? 'active' : 'inactive')
      break
    }
    case 'room.remove': {
      const r = db.rooms.find((x) => x.slug === id)
      if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      // Safety: refuse to delete a category that has active bookings.
      const hasActive = db.bookings.some(
        (b) => b.roomSlug === id && b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'checked_out',
      )
      if (hasActive) return NextResponse.json({ error: 'Room has active bookings — disable it instead.' }, { status: 409 })
      db.rooms = db.rooms.filter((x) => x.slug !== id)
      db.physicalRooms = db.physicalRooms.filter((x) => x.roomSlug !== id)
      db.roomBlocks = db.roomBlocks.filter((x) => x.roomSlug !== id)
      audit(actor, 'room.remove', String(id))
      break
    }
    case 'roomBlock.create': {
      const room = db.rooms.find((r) => r.slug === payload?.roomSlug)
      if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      const start = String(payload?.start || '')
      const end = String(payload?.end || '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
      }
      const reasons: RoomBlockReason[] = ['maintenance', 'private_booking', 'closure', 'other']
      db.roomBlocks.push({
        id: uid(),
        roomSlug: room.slug,
        units: Math.max(1, Math.min(Number(payload?.units) || 1, room.totalUnits)),
        start,
        end,
        reason: reasons.includes(payload?.reason) ? payload.reason : 'other',
        note: payload?.note ? String(payload.note).slice(0, 300) : undefined,
        createdBy: user.name,
        createdAt: Date.now(),
      })
      audit(actor, 'roomBlock.create', room.slug, `${start}→${end}`)
      break
    }
    case 'roomBlock.remove': {
      db.roomBlocks = db.roomBlocks.filter((b) => b.id !== id)
      audit(actor, 'roomBlock.remove', String(id))
      break
    }
    case 'staff.create': {
      if (!payload?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      db.staff.push({
        id: uid(),
        name: payload.name,
        role: payload.role || 'Staff',
        email: payload.email || '',
        phone: payload.phone,
        active: true,
      })
      // Optionally elevate an existing user account into a staff RBAC role so the
      // person can actually sign in to the back office.
      if (payload?.linkEmail && payload?.accessRole) {
        const u = db.users.find((x) => x.email.toLowerCase() === String(payload.linkEmail).toLowerCase())
        const roles: Role[] = ['manager', 'front_desk', 'housekeeping', 'restaurant', 'chef', 'accountant', 'staff', 'admin']
        if (u && roles.includes(payload.accessRole)) {
          u.role = payload.accessRole
          audit(actor, 'staff.setRole', u.email, payload.accessRole)
        }
      }
      audit(actor, 'staff.create', payload.name)
      break
    }
    case 'staff.update': {
      const s = db.staff.find((x) => x.id === id)
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.name != null) s.name = String(payload.name)
      if (payload?.role != null) s.role = String(payload.role)
      if (payload?.email != null) s.email = String(payload.email)
      if (payload?.phone != null) s.phone = String(payload.phone)
      if (payload?.active != null) s.active = !!payload.active
      audit(actor, 'staff.update', s.name)
      break
    }
    case 'staff.setRole': {
      // Change the RBAC role of a login account by email.
      const u = db.users.find((x) => x.email.toLowerCase() === String(payload?.email || '').toLowerCase())
      if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const roles: Role[] = ['customer', 'staff', 'manager', 'front_desk', 'housekeeping', 'restaurant', 'chef', 'accountant', 'admin']
      if (!roles.includes(payload?.role)) return NextResponse.json({ error: 'Bad role' }, { status: 400 })
      // Guard: never let anyone change their own access from this panel.
      if (u.id === user.id) {
        return NextResponse.json({ error: 'You cannot change your own access.' }, { status: 400 })
      }
      // Guard: owner/admin accounts can only be modified by a super_admin.
      if ((u.role === 'admin' || u.role === 'super_admin') && user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only an owner can modify admin accounts.' }, { status: 403 })
      }
      // Guard: only a super_admin may grant admin-level access.
      if ((payload.role === 'admin' || payload.role === 'super_admin') && user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only an owner can grant admin access.' }, { status: 403 })
      }
      u.role = payload.role
      audit(actor, 'staff.setRole', u.email, payload.role)
      break
    }
    case 'staff.remove': {
      db.staff = db.staff.filter((s) => s.id !== id)
      audit(actor, 'staff.remove', String(id))
      break
    }
    case 'table.create': {
      if (!payload?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      db.tables.push({
        id: uid(),
        name: String(payload.name),
        seats: Math.max(1, Number(payload.seats) || 2),
        location: String(payload.location || ''),
        status: 'available',
      })
      audit(actor, 'table.create', payload.name)
      break
    }
    case 'table.update': {
      const tb = db.tables.find((x) => x.id === id)
      if (!tb) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.name != null) tb.name = String(payload.name)
      if (payload?.seats != null) tb.seats = Math.max(1, Number(payload.seats))
      if (payload?.location != null) tb.location = String(payload.location)
      if (payload?.status != null && ['available', 'reserved', 'occupied', 'cleaning'].includes(payload.status)) tb.status = payload.status
      break
    }
    case 'table.remove': {
      db.tables = db.tables.filter((x) => x.id !== id)
      audit(actor, 'table.remove', String(id))
      break
    }
    case 'menu.create': {
      if (!payload?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      db.menuItems.push({
        id: uid(),
        category: String(payload.category || 'Uncategorised'),
        name: String(payload.name),
        desc: String(payload.desc || ''),
        priceUSD: Math.max(0, Number(payload.priceUSD) || 0),
        image: payload.image ? String(payload.image) : undefined,
        vegetarian: !!payload.vegetarian,
        available: true,
        featured: !!payload.featured,
        offer: payload.offer ? String(payload.offer) : undefined,
      })
      audit(actor, 'menu.create', payload.name)
      break
    }
    case 'menu.update': {
      const m = db.menuItems.find((x) => x.id === id)
      if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.name != null) m.name = String(payload.name)
      if (payload?.category != null) m.category = String(payload.category)
      if (payload?.desc != null) m.desc = String(payload.desc)
      if (payload?.priceUSD != null) m.priceUSD = Math.max(0, Number(payload.priceUSD))
      if (payload?.vegetarian != null) m.vegetarian = !!payload.vegetarian
      if (payload?.featured != null) m.featured = !!payload.featured
      if (payload?.image != null) m.image = String(payload.image) || undefined
      break
    }
    case 'menu.remove': {
      db.menuItems = db.menuItems.filter((x) => x.id !== id)
      audit(actor, 'menu.remove', String(id))
      break
    }
    case 'offer.create': {
      if (!payload?.title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
      db.offers.push({
        id: uid(),
        title: String(payload.title),
        tag: String(payload.tag || ''),
        image: String(payload.image || '/images/offers-hero.png'),
        desc: String(payload.desc || ''),
        includes: Array.isArray(payload.includes) ? payload.includes.map((x: unknown) => String(x)) : String(payload.includes || '').split(',').map((s) => s.trim()).filter(Boolean),
        price: String(payload.price || ''),
        active: true,
      })
      audit(actor, 'offer.create', payload.title)
      break
    }
    case 'offer.update': {
      const o = db.offers.find((x) => x.id === id)
      if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.title != null) o.title = String(payload.title)
      if (payload?.tag != null) o.tag = String(payload.tag)
      if (payload?.image != null) o.image = String(payload.image)
      if (payload?.desc != null) o.desc = String(payload.desc)
      if (payload?.price != null) o.price = String(payload.price)
      if (payload?.includes != null) o.includes = Array.isArray(payload.includes) ? payload.includes.map((x: unknown) => String(x)) : String(payload.includes).split(',').map((s) => s.trim()).filter(Boolean)
      break
    }
    case 'offer.remove': {
      db.offers = db.offers.filter((x) => x.id !== id)
      audit(actor, 'offer.remove', String(id))
      break
    }
    case 'addon.create': {
      if (!payload?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      db.addOns.push({
        id: uid(),
        name: String(payload.name),
        priceUSD: Math.max(0, Number(payload.priceUSD) || 0),
        perNight: !!payload.perNight,
        active: true,
        description: payload.description ? String(payload.description) : undefined,
      })
      audit(actor, 'addon.create', payload.name)
      break
    }
    case 'addon.remove': {
      db.addOns = db.addOns.filter((x) => x.id !== id)
      audit(actor, 'addon.remove', String(id))
      break
    }
    case 'seasonalRate.create': {
      if (!payload?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      const start = String(payload?.start || '')
      const end = String(payload?.end || '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start) {
        return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
      }
      db.seasonalRates.push({
        id: uid(),
        name: String(payload.name),
        start,
        end,
        multiplier: Math.max(0.1, Number(payload.multiplier) || 1),
        roomSlug: payload.roomSlug || undefined,
        active: true,
      })
      audit(actor, 'seasonalRate.create', payload.name)
      break
    }
    case 'seasonalRate.remove': {
      db.seasonalRates = db.seasonalRates.filter((x) => x.id !== id)
      audit(actor, 'seasonalRate.remove', String(id))
      break
    }
    case 'review.delete': {
      db.reviews = db.reviews.filter((x) => x.id !== id)
      audit(actor, 'review.delete', String(id))
      break
    }
    case 'payment.reconcile': {
      const p = db.payments.find((x) => x.id === id)
      if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const allowed = ['pending', 'paid', 'failed', 'refunded']
      if (!allowed.includes(payload?.status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 })
      p.status = payload.status
      if (payload.status === 'paid') p.verifiedAt = Date.now()
      // Keep the linked booking's payment status in sync.
      const b = db.bookings.find((x) => x.id === p.bookingId)
      if (b) {
        if (payload.status === 'paid') {
          b.paymentStatus = 'paid'
          b.amountPaid = b.total
          if (b.status === 'pending') b.status = 'confirmed'
        } else if (payload.status === 'refunded') {
          b.paymentStatus = 'refunded'
        } else if (payload.status === 'failed') {
          b.paymentStatus = 'failed'
        }
      }
      audit(actor, 'payment.reconcile', p.transactionUuid, payload.status)
      break
    }
    case 'contact.setStatus': {
      const m = db.contactMessages.find((x) => x.id === id)
      if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const allowed = ['new', 'read', 'replied', 'archived']
      if (!allowed.includes(payload?.status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 })
      m.status = payload.status
      if (payload.status === 'replied') {
        m.repliedAt = Date.now()
        m.handledBy = user.name
      }
      break
    }
    case 'contact.remove': {
      db.contactMessages = db.contactMessages.filter((x) => x.id !== id)
      break
    }
    case 'notification.read': {
      const n = db.notifications.find((x) => x.id === id && x.userId === user.id)
      if (n) n.read = true
      break
    }
    case 'notification.readAll': {
      for (const n of db.notifications) if (n.userId === user.id) n.read = true
      break
    }
    case 'settings.update': {
      const s = db.settings
      const p = payload ?? {}
      const strFields = [
        'hotelName', 'shortName', 'websiteTitle', 'tagline', 'description', 'phone', 'email',
        'address', 'whatsapp', 'mapsLink', 'websiteUrl', 'checkInTime', 'checkOutTime',
        'restaurantHours', 'footerText',
      ] as const
      for (const f of strFields) if (p[f] != null) (s as Record<string, unknown>)[f] = String(p[f]).slice(0, 2000)
      if (p.currency === 'USD' || p.currency === 'NPR') s.currency = p.currency
      if (p.taxRatePct != null) s.taxRatePct = Math.max(0, Math.min(100, Number(p.taxRatePct) || 0))
      if (p.social) s.social = { ...s.social, ...p.social }
      if (p.hero) s.hero = { ...s.hero, ...p.hero }
      if (p.restaurant) s.restaurant = { ...s.restaurant, ...p.restaurant }
      if (p.seo) s.seo = { ...s.seo, ...p.seo }
      s.updatedAt = Date.now()
      audit(actor, 'settings.update', 'site')
      break
    }
    case 'gallery.create': {
      if (!payload?.src) return NextResponse.json({ error: 'Image required' }, { status: 400 })
      const maxOrder = db.gallery.reduce((m, g) => Math.max(m, g.order), -1)
      db.gallery.push({
        id: uid(),
        src: String(payload.src),
        alt: String(payload.alt || payload.title || 'Gallery image').slice(0, 200),
        title: payload.title ? String(payload.title).slice(0, 200) : '',
        description: payload.description ? String(payload.description).slice(0, 500) : '',
        category: String(payload.category || 'Other') as never,
        featured: !!payload.featured,
        enabled: payload.enabled !== false,
        order: maxOrder + 1,
        createdAt: Date.now(),
      })
      audit(actor, 'gallery.create', payload.title || 'image')
      break
    }
    case 'gallery.update': {
      const g = db.gallery.find((x) => x.id === id)
      if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.src != null) g.src = String(payload.src)
      if (payload?.alt != null) g.alt = String(payload.alt).slice(0, 200)
      if (payload?.title != null) g.title = String(payload.title).slice(0, 200)
      if (payload?.description != null) g.description = String(payload.description).slice(0, 500)
      if (payload?.category != null) g.category = String(payload.category) as never
      if (payload?.featured != null) g.featured = !!payload.featured
      if (payload?.enabled != null) g.enabled = !!payload.enabled
      break
    }
    case 'gallery.toggle': {
      const g = db.gallery.find((x) => x.id === id)
      if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      g.enabled = !g.enabled
      break
    }
    case 'gallery.remove': {
      db.gallery = db.gallery.filter((x) => x.id !== id)
      audit(actor, 'gallery.remove', String(id))
      break
    }
    case 'gallery.reorder': {
      // payload.ids = ordered array of gallery ids
      const ids: string[] = Array.isArray(payload?.ids) ? payload.ids.map(String) : []
      ids.forEach((gid, i) => {
        const g = db.gallery.find((x) => x.id === gid)
        if (g) g.order = i
      })
      break
    }
    case 'faq.create': {
      if (!payload?.question || !payload?.answer) return NextResponse.json({ error: 'Question and answer required' }, { status: 400 })
      const maxOrder = db.faqs.reduce((m, f) => Math.max(m, f.order), -1)
      db.faqs.push({
        id: uid(),
        question: String(payload.question).slice(0, 300),
        answer: String(payload.answer).slice(0, 3000),
        category: String(payload.category || 'General').slice(0, 100),
        active: payload.active !== false,
        order: maxOrder + 1,
        createdAt: Date.now(),
      })
      audit(actor, 'faq.create', payload.question)
      break
    }
    case 'faq.update': {
      const f = db.faqs.find((x) => x.id === id)
      if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.question != null) f.question = String(payload.question).slice(0, 300)
      if (payload?.answer != null) f.answer = String(payload.answer).slice(0, 3000)
      if (payload?.category != null) f.category = String(payload.category).slice(0, 100)
      if (payload?.active != null) f.active = !!payload.active
      break
    }
    case 'faq.toggle': {
      const f = db.faqs.find((x) => x.id === id)
      if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      f.active = !f.active
      break
    }
    case 'faq.remove': {
      db.faqs = db.faqs.filter((x) => x.id !== id)
      audit(actor, 'faq.remove', String(id))
      break
    }
    case 'faq.reorder': {
      const ids: string[] = Array.isArray(payload?.ids) ? payload.ids.map(String) : []
      ids.forEach((fid, i) => {
        const f = db.faqs.find((x) => x.id === fid)
        if (f) f.order = i
      })
      break
    }
    case 'review.edit': {
      const rev = db.reviews.find((x) => x.id === id)
      if (!rev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.name != null) rev.name = String(payload.name).slice(0, 120)
      if (payload?.country != null) rev.country = String(payload.country).slice(0, 120)
      if (payload?.text != null) rev.text = String(payload.text).slice(0, 2000)
      if (payload?.trip != null) rev.trip = String(payload.trip).slice(0, 120)
      if (payload?.rating != null) rev.rating = Math.max(1, Math.min(5, Number(payload.rating) || 5))
      audit(actor, 'review.edit', rev.id)
      break
    }
    case 'review.feature': {
      const rev = db.reviews.find((x) => x.id === id)
      if (!rev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      rev.featured = !rev.featured
      // Featuring a review implicitly approves it so it can appear publicly.
      if (rev.featured) rev.approved = true
      break
    }
    case 'emailTemplate.update': {
      const tpl = db.settings.emailTemplates.find((x) => x.id === id)
      if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (payload?.subject != null) tpl.subject = String(payload.subject).slice(0, 300)
      if (payload?.body != null) tpl.body = String(payload.body).slice(0, 5000)
      audit(actor, 'emailTemplate.update', tpl.id)
      break
    }
    case 'changeRequest.approve': {
      const cr = db.changeRequests.find((x) => x.id === id)
      if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (cr.status !== 'pending') {
        return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 })
      }
      const b = db.bookings.find((x) => x.id === cr.bookingId)
      if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

      // Resolve target values (fall back to the booking's current values).
      const targetRoomSlug = cr.roomSlug ?? b.roomSlug
      const targetCheckIn = cr.checkIn ?? b.checkIn
      const targetCheckOut = cr.checkOut ?? b.checkOut
      const targetGuests = cr.guests ?? b.guests
      const room = db.rooms.find((r) => r.slug === targetRoomSlug)
      if (!room) return NextResponse.json({ error: 'Requested room no longer exists.' }, { status: 400 })

      // Capacity + availability are re-validated at approval time so an admin can
      // never approve a change into an over-capacity or already-booked room.
      if (targetGuests > room.maxGuests * b.rooms) {
        return NextResponse.json(
          { error: `The ${room.name} holds up to ${room.maxGuests} guests per room.` },
          { status: 409 },
        )
      }
      if (cr.type === 'dates' || cr.type === 'room') {
        if (unitsAvailable(targetRoomSlug, targetCheckIn, targetCheckOut, b.id) < b.rooms) {
          return NextResponse.json(
            { error: 'Requested room/dates are no longer available.' },
            { status: 409 },
          )
        }
      }

      // Apply the change to the booking.
      b.roomSlug = targetRoomSlug
      b.roomName = room.name
      b.checkIn = targetCheckIn
      b.checkOut = targetCheckOut
      b.nights = nightsBetween(targetCheckIn, targetCheckOut)
      b.guests = targetGuests
      // Recompute pricing for room/date changes so finances stay consistent.
      if (cr.type === 'dates' || cr.type === 'room') {
        const q = quote({
          roomSlug: b.roomSlug,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          rooms: b.rooms,
          currency: b.currency,
          couponCode: b.couponCode,
        })
        b.subtotal = q.subtotal
        b.tax = q.tax + q.service
        b.discount = q.discount
        b.total = q.total
      }

      cr.status = 'approved'
      if (payload?.note != null) cr.adminNote = String(payload.note).slice(0, 500)
      cr.resolvedAt = Date.now()
      cr.resolvedBy = user.name
      audit(actor, 'changeRequest.approve', b.ref, cr.type)
      if (b.userId) {
        notify(
          b.userId,
          'Change request approved',
          `Your ${cr.type} change to booking ${b.ref} has been approved.`,
          'booking',
        )
      }
      try {
        await sendBookingEmail(b, 'confirmed')
      } catch (err) {
        console.log('[v0] Change approval email failed:', err instanceof Error ? err.message : 'unknown')
      }
      break
    }
    case 'changeRequest.reject': {
      const cr = db.changeRequests.find((x) => x.id === id)
      if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (cr.status !== 'pending') {
        return NextResponse.json({ error: 'This request has already been resolved.' }, { status: 400 })
      }
      cr.status = 'rejected'
      if (payload?.note != null) cr.adminNote = String(payload.note).slice(0, 500)
      cr.resolvedAt = Date.now()
      cr.resolvedBy = user.name
      audit(actor, 'changeRequest.reject', cr.bookingRef, cr.type)
      if (cr.userId) {
        notify(
          cr.userId,
          'Change request declined',
          `Your ${cr.type} change to booking ${cr.bookingRef} was declined.${
            cr.adminNote ? ` Note: ${cr.adminNote}` : ''
          }`,
          'booking',
        )
      }
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await persistDurable()
  return NextResponse.json({ ok: true })
}
