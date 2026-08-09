// Modular payment architecture for Nepal gateways.
//
// Each provider implements the same PaymentProvider contract so the checkout UI
// and API routes stay gateway-agnostic. When live merchant credentials are
// present in the environment, a provider can call the official API; otherwise it
// runs a faithful sandbox flow that still performs real server-side verification
// against the stored Payment record (amount + transaction id), so tampering with
// client-side amounts is impossible.

export type ProviderId = 'esewa' | 'khalti' | 'fonepay'

export type InitiateInput = {
  transactionUuid: string
  amountNPR: number
  bookingRef: string
  returnUrl: string
}

export type InitiateResult = {
  // URL the browser should visit to complete payment. In sandbox mode this is
  // our own hosted gateway simulator; in live mode it is the provider's URL.
  gatewayUrl: string
  mode: 'live' | 'sandbox'
  // Optional provider reference (e.g. Khalti pidx).
  providerRef?: string
}

export type VerifyInput = {
  transactionUuid: string
  amountNPR: number
  // Outcome reported by the redirect / sandbox. Live mode ignores this and
  // queries the provider's status API instead.
  reportedStatus?: 'success' | 'failed'
  providerRef?: string
}

export type VerifyResult = {
  status: 'paid' | 'failed' | 'pending'
  providerRef?: string
  message?: string
}

export type PaymentProvider = {
  id: ProviderId
  label: string
  isLive: () => boolean
  initiate: (input: InitiateInput) => Promise<InitiateResult>
  verify: (input: VerifyInput) => Promise<VerifyResult>
}
