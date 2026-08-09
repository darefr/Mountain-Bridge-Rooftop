import type { PaymentProvider } from './types'

// Khalti ePayment (KPG-2). Live mode initiates via the Khalti API with a server
// secret key and confirms via the lookup API. Requires KHALTI_SECRET_KEY.

const BASE =
  process.env.KHALTI_ENV === 'production'
    ? 'https://khalti.com/api/v2'
    : 'https://dev.khalti.com/api/v2'

function isLive() {
  return Boolean(process.env.KHALTI_SECRET_KEY)
}

export const khalti: PaymentProvider = {
  id: 'khalti',
  label: 'Khalti',
  isLive,
  async initiate({ transactionUuid, amountNPR, bookingRef, returnUrl }) {
    if (isLive()) {
      const res = await fetch(`${BASE}/epayment/initiate/`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: returnUrl,
          website_url: returnUrl.split('/pay')[0] || returnUrl,
          amount: amountNPR * 100, // Khalti expects paisa
          purchase_order_id: transactionUuid,
          purchase_order_name: `Hotel Mountain Bridge ${bookingRef}`,
        }),
      })
      const data = (await res.json()) as { pidx?: string; payment_url?: string }
      if (data.payment_url) {
        return { gatewayUrl: data.payment_url, mode: 'live', providerRef: data.pidx }
      }
      throw new Error('Khalti initiation failed')
    }
    const url = `/pay/gateway?provider=khalti&txn=${transactionUuid}&amount=${amountNPR}&return=${encodeURIComponent(returnUrl)}`
    return { gatewayUrl: url, mode: 'sandbox' }
  },
  async verify({ transactionUuid, reportedStatus, providerRef }) {
    if (isLive()) {
      try {
        const res = await fetch(`${BASE}/epayment/lookup/`, {
          method: 'POST',
          headers: {
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pidx: providerRef }),
        })
        const data = (await res.json()) as { status?: string; transaction_id?: string }
        if (data.status === 'Completed') return { status: 'paid', providerRef: data.transaction_id }
        if (data.status === 'Pending' || data.status === 'Initiated') return { status: 'pending' }
        return { status: 'failed', message: data.status }
      } catch {
        return { status: 'pending', message: 'Lookup failed, will retry.' }
      }
    }
    return {
      status: reportedStatus === 'success' ? 'paid' : 'failed',
      providerRef: `KHL-${transactionUuid.slice(0, 8).toUpperCase()}`,
    }
  },
}
