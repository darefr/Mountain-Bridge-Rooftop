import { db } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { isStaffRole, isManagerRole } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  const esc = s.replace(/"/g, '""')
  return /[",\n]/.test(esc) ? `"${esc}"` : esc
}

function toCsv(cols: string[], rows: Record<string, unknown>[]): string {
  const header = cols.join(',')
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))
  return [header, ...body].join('\n')
}

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  if (!isStaffRole(user.role)) return new Response('Forbidden', { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'bookings'

  // Finance/customer exports require manager-level access.
  const managerOnly = new Set(['payments', 'customers', 'revenue'])
  if (managerOnly.has(type) && !isManagerRole(user.role)) {
    return new Response('Forbidden', { status: 403 })
  }

  let cols: string[] = []
  let rows: Record<string, unknown>[] = []
  const iso = (ms?: number) => (ms ? new Date(ms).toISOString() : '')

  switch (type) {
    case 'bookings':
      cols = ['ref', 'guestName', 'guestEmail', 'roomName', 'checkIn', 'checkOut', 'nights', 'rooms', 'guests', 'currency', 'subtotal', 'discount', 'tax', 'total', 'status', 'paymentStatus', 'paymentMethod', 'source', 'createdAt']
      rows = db.bookings.map((b) => ({ ...b, createdAt: iso(b.createdAt) }))
      break
    case 'payments':
      cols = ['transactionUuid', 'bookingId', 'provider', 'amount', 'currency', 'status', 'providerRef', 'verifiedAt', 'createdAt']
      rows = db.payments.map((p) => ({ ...p, verifiedAt: iso(p.verifiedAt), createdAt: iso(p.createdAt) }))
      break
    case 'customers':
      cols = ['name', 'email', 'phone', 'country', 'emailVerified', 'bookings', 'totalSpendUSD', 'createdAt']
      rows = db.users
        .filter((u) => u.role === 'customer')
        .map((u) => {
          const ub = db.bookings.filter((b) => b.userId === u.id)
          const spend = ub
            .filter((b) => b.paymentStatus === 'paid')
            .reduce((s, b) => s + (b.currency === 'NPR' ? b.total / 133 : b.total), 0)
          return {
            name: u.name,
            email: u.email,
            phone: u.phone ?? '',
            country: u.country ?? '',
            emailVerified: u.emailVerified,
            bookings: ub.length,
            totalSpendUSD: Math.round(spend),
            createdAt: iso(u.createdAt),
          }
        })
      break
    case 'reservations':
      cols = ['ref', 'name', 'phone', 'email', 'date', 'time', 'guests', 'tableId', 'status', 'createdAt']
      rows = db.reservations.map((r) => ({ ...r, createdAt: iso(r.createdAt) }))
      break
    case 'revenue': {
      cols = ['date', 'bookings', 'paidRevenueUSD']
      const bucket = new Map<string, { bookings: number; revenue: number }>()
      for (const b of db.bookings) {
        const k = new Date(b.createdAt).toISOString().split('T')[0]
        const cur = bucket.get(k) ?? { bookings: 0, revenue: 0 }
        cur.bookings += 1
        if (b.paymentStatus === 'paid') cur.revenue += b.currency === 'NPR' ? b.total / 133 : b.total
        bucket.set(k, cur)
      }
      rows = [...bucket.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, bookings: v.bookings, paidRevenueUSD: Math.round(v.revenue) }))
      break
    }
    default:
      return new Response('Unknown export type', { status: 400 })
  }

  const csv = toCsv(cols, rows)
  const filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8;',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
