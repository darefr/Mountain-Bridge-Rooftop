import { NextResponse } from 'next/server'
import { db, persist, persistDurable, uid, ensureLoaded } from '@/lib/db/store'
import { USD_TO_NPR } from '@/lib/booking'
import { getProvider } from '@/lib/payments'
import type { Payment } from '@/lib/db/types'

export async function POST(req: Request) {
  await ensureLoaded()
  const { bookingId, provider } = await req.json().catch(() => ({}))
  const gateway = getProvider(String(provider))
  if (!gateway) return NextResponse.json({ error: 'Unknown payment provider.' }, { status: 400 })

  const booking = db.bookings.find((b) => b.id === bookingId || b.ref === bookingId)
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

  // Always compute the payable amount server-side; never trust the client.
  const amountNPR = booking.currency === 'NPR' ? booking.total : Math.round(booking.total * USD_TO_NPR)

  const transactionUuid = `${booking.ref}-${uid().slice(0, 8)}`
  const origin = new URL(req.url).origin
  const returnUrl = `${origin}/pay/result?txn=${transactionUuid}`

  const payment: Payment = {
    id: uid(),
    bookingId: booking.id,
    provider: gateway.id,
    amount: amountNPR,
    currency: 'NPR',
    status: 'pending',
    transactionUuid,
    createdAt: Date.now(),
  }
  db.payments.push(payment)
  booking.paymentStatus = 'pending'
  booking.paymentMethod = gateway.id
  await persistDurable()

  const result = await gateway.initiate({ transactionUuid, amountNPR, bookingRef: booking.ref, returnUrl })
  if (result.providerRef) {
    payment.providerRef = result.providerRef
    persist()
  }

  return NextResponse.json({
    transactionUuid,
    amountNPR,
    provider: gateway.id,
    mode: result.mode,
    gatewayUrl: result.gatewayUrl,
  })
}
