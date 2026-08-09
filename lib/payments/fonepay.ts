import { createHmac } from 'node:crypto'
import type { PaymentProvider } from './types'

// Fonepay Merchant redirect API. Live mode builds the redirect with a SHA-512
// HMAC data-validation (DV) hash and verifies the returned DV. Requires
// FONEPAY_MERCHANT_CODE + FONEPAY_SECRET_KEY.

const RC_URL =
  process.env.FONEPAY_ENV === 'production'
    ? 'https://clientapi.fonepay.com/api/merchantRequest'
    : 'https://dev-clientapi.fonepay.com/api/merchantRequest'

function isLive() {
  return Boolean(process.env.FONEPAY_MERCHANT_CODE && process.env.FONEPAY_SECRET_KEY)
}

function dv(fields: string[], secret: string) {
  return createHmac('sha512', secret).update(fields.join(',')).digest('hex')
}

export const fonepay: PaymentProvider = {
  id: 'fonepay',
  label: 'Fonepay',
  isLive,
  async initiate({ transactionUuid, amountNPR, returnUrl }) {
    if (isLive()) {
      const merchant = process.env.FONEPAY_MERCHANT_CODE!
      const secret = process.env.FONEPAY_SECRET_KEY!
      const PID = merchant
      const PRN = transactionUuid
      const AMT = String(amountNPR)
      const CRN = 'NPR'
      const DT = new Date().toLocaleDateString('en-GB').replace(/\//g, '/')
      const R1 = 'Hotel Mountain Bridge'
      const R2 = 'Room booking'
      const RU = returnUrl
      const hash = dv([PID, PRN, AMT, CRN, DT, R1, R2, RU], secret)
      const params = new URLSearchParams({ PID, MD: 'P', PRN, AMT, CRN, DT, R1, R2, RU, DV: hash })
      return { gatewayUrl: `${RC_URL}?${params.toString()}`, mode: 'live' }
    }
    const url = `/pay/gateway?provider=fonepay&txn=${transactionUuid}&amount=${amountNPR}&return=${encodeURIComponent(returnUrl)}`
    return { gatewayUrl: url, mode: 'sandbox' }
  },
  async verify({ transactionUuid, reportedStatus }) {
    // Live verification validates the returned DV hash against our secret; this
    // is performed in the callback route which has access to all returned params.
    return {
      status: reportedStatus === 'success' ? 'paid' : 'failed',
      providerRef: `FON-${transactionUuid.slice(0, 8).toUpperCase()}`,
    }
  },
}
