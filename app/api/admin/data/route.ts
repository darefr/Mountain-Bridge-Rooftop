import { NextResponse } from 'next/server'
import { db } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { unitsAvailable } from '@/lib/booking'
import { isStaffRole } from '@/lib/db/types'
import { isEmailConfigured } from '@/lib/email/mailer'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isStaffRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  // Revenue = sum of paid booking totals (normalize to USD for reporting).
  const revenue = db.bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.currency === 'NPR' ? b.total / 133 : b.total), 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthlyRevenue = db.bookings
    .filter((b) => b.paymentStatus === 'paid' && b.createdAt >= monthStart.getTime())
    .reduce((sum, b) => sum + (b.currency === 'NPR' ? b.total / 133 : b.total), 0)

  const customers = db.users.filter((u) => u.role === 'customer')

  const rooms = db.rooms.map((r) => ({
    ...r,
    availableNow: unitsAvailable(r.slug, today, in30),
  }))

  // --- PMS operational stats (Phase 11) ---
  const active = db.bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'no_show')
  const arrivalsToday = active.filter((b) => b.checkIn === today)
  const departuresToday = active.filter((b) => b.checkOut === today)
  const occupiedRooms = db.physicalRooms.filter((r) => r.status === 'occupied').length
  const availableRooms = db.physicalRooms.filter((r) => r.status === 'available').length
  const cleaningRooms = db.physicalRooms.filter(
    (r) => r.status === 'cleaning' || r.housekeeping === 'dirty',
  ).length
  const outOfServiceRooms = db.physicalRooms.filter(
    (r) => r.status === 'maintenance' || r.status === 'out_of_service',
  ).length
  const occupancyRate = db.physicalRooms.length
    ? Math.round((occupiedRooms / db.physicalRooms.length) * 100)
    : 0
  const pendingBookings = db.bookings.filter((b) => b.status === 'pending').length
  const pendingPayments = db.bookings.filter(
    (b) => b.paymentStatus === 'unpaid' || b.paymentStatus === 'pending' || b.paymentStatus === 'partial',
  ).length

  const toUSD = (b: { currency: string; total: number }) => (b.currency === 'NPR' ? b.total / 133 : b.total)

  // Strip password material from users. Never expose passwordHash/salt/challenges.
  const safeUsers = customers.map((u) => {
    const ub = db.bookings.filter((b) => b.userId === u.id)
    const paid = ub.filter((b) => b.paymentStatus === 'paid')
    const last = ub.reduce((m, b) => Math.max(m, b.createdAt), 0)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      country: u.country,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      bookings: ub.length,
      totalSpendUSD: Math.round(paid.reduce((s, b) => s + toUSD(b), 0)),
      lastBookingAt: last || undefined,
    }
  })

  const isManager = user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager'
  const emailStatus = isManager ? isEmailConfigured() : undefined

  // Login accounts that hold a back-office (non-customer) role. These are the
  // real RBAC principals whose access level managers can change by email.
  const team = db.users
    .filter((u) => u.role !== 'customer')
    .map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const unreadNotifications = db.notifications.filter((n) => n.userId === user.id && !n.read).length
  const newContactMessages = db.contactMessages.filter((m) => m.status === 'new').length
  const pendingChangeRequests = db.changeRequests.filter((c) => c.status === 'pending').length

  return NextResponse.json({
    me: { id: user.id, name: user.name, role: user.role, image: user.image },
    stats: {
      revenue: Math.round(revenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      bookings: db.bookings.length,
      customers: customers.length,
      reservations: db.reservations.length,
      arrivalsToday: arrivalsToday.length,
      departuresToday: departuresToday.length,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      outOfServiceRooms,
      occupancyRate,
      pendingBookings,
      pendingPayments,
      orders: db.orders.length,
      todayBookings: db.bookings.filter((b) => new Date(b.createdAt).toISOString().split('T')[0] === today).length,
      cancelledBookings: db.bookings.filter((b) => b.status === 'cancelled').length,
      completedBookings: db.bookings.filter((b) => b.status === 'completed' || b.status === 'checked_out').length,
      reservationsPending: db.reservations.filter((r) => r.status === 'pending').length,
      newCustomers: customers.filter((u) => u.createdAt >= monthStart.getTime()).length,
      reviews: db.reviews.length,
      pendingReviews: db.reviews.filter((r) => !r.approved).length,
      unreadNotifications,
      newContactMessages,
      pendingChangeRequests,
    },
    today,
    rooms,
    physicalRooms: [...db.physicalRooms].sort((a, b) => a.number.localeCompare(b.number)),
    housekeepingTasks: [...db.housekeepingTasks].sort((a, b) => b.createdAt - a.createdAt),
    arrivals: arrivalsToday.sort((a, b) => a.createdAt - b.createdAt),
    departures: departuresToday.sort((a, b) => a.createdAt - b.createdAt),
    bookings: [...db.bookings].sort((a, b) => b.createdAt - a.createdAt),
    reservations: [...db.reservations].sort((a, b) => b.createdAt - a.createdAt),
    customers: safeUsers,
    staff: db.staff,
    team: isManager ? team : [],
    tables: db.tables,
    payments: [...db.payments].sort((a, b) => b.createdAt - a.createdAt),
    reviews: [...db.reviews].sort((a, b) => b.createdAt - a.createdAt),
    offers: db.offers,
    coupons: db.coupons,
    addOns: db.addOns,
    seasonalRates: db.seasonalRates,
    menuItems: [...db.menuItems].sort((a, b) => a.category.localeCompare(b.category)),
    orders: [...db.orders].sort((a, b) => b.createdAt - a.createdAt),
    auditLogs: isManager ? [...db.auditLogs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100) : [],
    notifications: [...db.notifications]
      .filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 60),
    contactMessages: [...db.contactMessages].sort((a, b) => b.createdAt - a.createdAt),
    changeRequests: [...db.changeRequests].sort((a, b) => b.createdAt - a.createdAt),
    roomBlocks: [...db.roomBlocks].sort((a, b) => a.start.localeCompare(b.start)),
    gallery: [...db.gallery].sort((a, b) => a.order - b.order),
    faqs: [...db.faqs].sort((a, b) => a.order - b.order),
    settings: isManager ? db.settings : undefined,
    emailConfigured: emailStatus,
  })
}
