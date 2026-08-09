import { NextResponse } from 'next/server'
import { db, persistDurable, ensureLoaded } from '@/lib/db/store'
import { getProvider } from '@/lib/payments'
import { notify } from '@/lib/notify'
import { sendBookingEmail } from '@/lib/email/mailer'

// Server-side verification. The client redirect only reports an intent; the
// authoritative status comes from the provider (live) or from re-checking the
// stored Payment amount (sandbox). We never mark a booking paid based on a
// client-supplied amount or status alone.
export async function POST(req: Request) {
  await ensureLoaded()
  const body = await req.json().catch(() => ({}))
  const transactionUuid = String(body.transactionUuid ?? body.txn ?? '')
  const payment = db.payments.find((p) => p.transactionUuid === transactionUuid)
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  const gateway = getProvider(payment.provider)
  if (!gateway) return NextResponse.json({ error: 'Unknown provider.' }, { status: 400 })

  const booking = db.bookings.find((b) => b.id === payment.bookingId)

  const result = await gateway.verify({
    transactionUuid,
    amountNPR: payment.amount,
    reportedStatus: body.reportedStatus,
    providerRef: body.providerRef ?? payment.providerRef,
  })

  payment.status = result.status
  if (result.providerRef) payment.providerRef = result.providerRef
  payment.verifiedAt = Date.now()

  let emailKind: 'payment_received' | 'payment_failed' | null = null
  if (booking) {
    const prevStatus = booking.paymentStatus
    if (result.status === 'paid') {
      booking.paymentStatus = 'paid'
      booking.status = 'confirmed'
      // Only fire notifications/emails on the first transition to paid.
      if (prevStatus !== 'paid') {
        emailKind = 'payment_received'
        if (booking.userId) {
          notify(
            booking.userId,
            'Payment received',
            `Payment for booking ${booking.ref} confirmed. We look forward to hosting you.`,
            'payment',
          )
        }
      }
    } else if (result.status === 'failed') {
      booking.paymentStatus = 'failed'
      if (prevStatus !== 'failed') emailKind = 'payment_failed'
    } else {
      booking.paymentStatus = 'pending'
    }
  }
  await persistDurable()

  if (booking && emailKind) {
    try {
      await sendBookingEmail(booking, emailKind)
    } catch (err) {
      console.log('[v0] Payment email failed:', err instanceof Error ? err.message : 'unknown')
    }
  }

  return NextResponse.json({
    status: result.status,
    bookingRef: booking?.ref ?? null,
    message: result.message,
  })
}
