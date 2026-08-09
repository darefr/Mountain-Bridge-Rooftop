import { createHmac } from 'node:crypto'
import type { PaymentProvider } from './types'

// eSewa ePay v2. Live mode signs the payload with the merchant secret (HMAC
// SHA256, base64) and posts to the eSewa form endpoint; status is confirmed via
// the transaction status API. Requires ESEWA_MERCHANT_CODE + ESEWA_SECRET_KEY.

const FORM_URL =
  process.env.ESEWA_ENV === 'production'
    ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
    : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
const STATUS_URL =
  process.env.ESEWA_ENV === 'production'
    ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
    : 'https://rc.esewa.com.np/api/epay/transaction/status/'

function isLive() {
  return Boolean(process.env.ESEWA_MERCHANT_CODE && process.env.ESEWA_SECRET_KEY)
}

export function esewaSignature(message: string, secret: string) {
  return createHmac('sha256', secret).update(message).digest('base64')
}

export const esewa: PaymentProvider = {
  id: 'esewa',
  label: 'eSewa',
  isLive,
  async initiate({ transactionUuid, amountNPR, returnUrl }) {
    if (isLive()) {
      const code = process.env.ESEWA_MERCHANT_CODE!
      const secret = process.env.ESEWA_SECRET_KEY!
      const signed = `total_amount=${amountNPR},transaction_uuid=${transactionUuid},product_code=${code}`
      const signature = esewaSignature(signed, secret)
      // The client renders an auto-submitting form to FORM_URL with these fields;
      // we hand back the endpoint + signed params via query for the checkout page.
      const params = new URLSearchParams({
        amount: String(amountNPR),
        tax_amount: '0',
        total_amount: String(amountNPR),
        transaction_uuid: transactionUuid,
        product_code: code,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: returnUrl,
        failure_url: returnUrl,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      })
      return { gatewayUrl: `${FORM_URL}?${params.toString()}`, mode: 'live' }
    }
    // Sandbox: our own hosted gateway simulator.
    const url = `/pay/gateway?provider=esewa&txn=${transactionUuid}&amount=${amountNPR}&return=${encodeURIComponent(returnUrl)}`
    return { gatewayUrl: url, mode: 'sandbox' }
  },
  async verify({ transactionUuid, amountNPR, reportedStatus }) {
    if (isLive()) {
      const code = process.env.ESEWA_MERCHANT_CODE!
      try {
        const res = await fetch(
          `${STATUS_URL}?product_code=${code}&total_amount=${amountNPR}&transaction_uuid=${transactionUuid}`,
        )
        const data = (await res.json()) as { status?: string; ref_id?: string }
        if (data.status === 'COMPLETE') return { status: 'paid', providerRef: data.ref_id }
        if (data.status === 'PENDING') return { status: 'pending' }
        return { status: 'failed', message: data.status }
      } catch {
        return { status: 'pending', message: 'Status check failed, will retry.' }
      }
    }
    // Sandbox verification: trust the simulator outcome but confirm the amount
    // matches the server-side record (done in the API route before calling this).
    return {
      status: reportedStatus === 'success' ? 'paid' : 'failed',
      providerRef: `ESW-${transactionUuid.slice(0, 8).toUpperCase()}`,
    }
  },
}
