import { NextResponse } from 'next/server'
import { db, ensureLoaded } from '@/lib/db/store'
import { listProviders } from '@/lib/payments'

export async function GET(req: Request) {
  await ensureLoaded()
  const { searchParams } = new URL(req.url)
  const txn = searchParams.get('txn')
  if (!txn) {
    // No txn: return the list of enabled providers for the checkout UI.
    return NextResponse.json({ providers: listProviders() })
  }
  const payment = db.payments.find((p) => p.transactionUuid === txn)
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const booking = db.bookings.find((b) => b.id === payment.bookingId)
  return NextResponse.json({
    status: payment.status,
    provider: payment.provider,
    amount: payment.amount,
    bookingRef: booking?.ref ?? null,
  })
}
