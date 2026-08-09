import { createGateway, type LanguageModel } from 'ai'

// ---------------------------------------------------------------------------
// Modular AI provider layer.
//
// The concierge talks to a single `resolveModel()` here so the underlying
// provider can be swapped without touching the route or the tools. By default
// it uses the Vercel AI Gateway (zero-config on Vercel via OIDC), but every
// piece is overridable with environment variables:
//
//   AI_MODEL        e.g. "google/gemini-2.5-flash" (provider/model string)
//   AI_GATEWAY_API_KEY  Vercel AI Gateway key (preferred when not on Vercel)
//   AI_API_KEY      Generic API key for a custom OpenAI/Gateway-compatible host
//   AI_BASE_URL     Custom gateway/base URL (OpenAI-compatible gateway endpoint)
//
// To move to a completely different SDK provider (OpenAI, Anthropic, a
// self-hosted model, …) you only change `resolveModel()` — nothing else.
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL = 'google/gemini-2.5-flash'

export function conciergeModelId(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL
}

// Whether we have any usable credentials/route to an AI provider. When false,
// the route falls back to the deterministic bilingual concierge so the widget
// always works.
export function aiAvailable(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.AI_BASE_URL ||
      process.env.VERCEL, // OIDC-backed gateway access on Vercel
  )
}

export function resolveModel(): LanguageModel {
  const modelId = conciergeModelId()

  // Custom host (self-hosted gateway or OpenAI-compatible proxy).
  if (process.env.AI_BASE_URL) {
    const gw = createGateway({
      apiKey: process.env.AI_API_KEY || process.env.AI_GATEWAY_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    })
    return gw(modelId)
  }

  // Explicit key (non-Vercel deployments or local dev).
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.AI_API_KEY
  if (apiKey) {
    const gw = createGateway({ apiKey })
    return gw(modelId)
  }

  // On Vercel the global gateway resolves the model string via OIDC.
  return modelId
}
