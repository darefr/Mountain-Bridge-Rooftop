import { esewa } from './esewa'
import { khalti } from './khalti'
import { fonepay } from './fonepay'
import type { PaymentProvider, ProviderId } from './types'

const registry: Record<ProviderId, PaymentProvider> = {
  esewa,
  khalti,
  fonepay,
}

export function getProvider(id: string): PaymentProvider | null {
  return (registry as Record<string, PaymentProvider>)[id] ?? null
}

export function listProviders() {
  return Object.values(registry).map((p) => ({
    id: p.id,
    label: p.label,
    live: p.isLive(),
  }))
}

export type { PaymentProvider, ProviderId }
