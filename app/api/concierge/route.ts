import { streamText, stepCountIs, type ModelMessage } from 'ai'
import { buildSystemPrompt } from '@/lib/ai/knowledge'
import { fallbackAnswer } from '@/lib/ai/fallback'
import { conciergeTools } from '@/lib/ai/tools'
import { resolveModel, aiAvailable } from '@/lib/ai/provider'
import { ensureLoaded } from '@/lib/db/store'

export const maxDuration = 30

type IncomingMessage = { role: 'user' | 'assistant'; content: string }

// Newline-delimited JSON protocol to the client:
//   {"t":"d","v":"text delta"}         — assistant text chunk
//   {"t":"card","name":"toolName",...} — structured tool result to render
//   {"t":"err"}                        — a recoverable error occurred
const enc = new TextEncoder()
function line(obj: unknown) {
  return enc.encode(JSON.stringify(obj) + '\n')
}

// Tool results the UI knows how to render as rich cards.
const CARD_TOOLS = new Set([
  'checkRoomAvailability',
  'createBookingDraft',
  'getRooms',
  'getOffers',
  'getRestaurantMenu',
  'checkRestaurantAvailability',
  'createRestaurantReservation',
])

export async function POST(req: Request) {
  await ensureLoaded()
  const { messages } = (await req.json().catch(() => ({ messages: [] }))) as {
    messages: IncomingMessage[]
  }

  const clean = (messages ?? [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-14) // conversation-memory window

  const lastUser = [...clean].reverse().find((m) => m.role === 'user')?.content ?? ''

  // No AI credentials → deterministic bilingual concierge, still over NDJSON.
  if (!aiAvailable()) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(line({ t: 'd', v: fallbackAnswer(lastUser) }))
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let gotText = false
      try {
        const result = streamText({
          model: resolveModel(),
          system: buildSystemPrompt(),
          messages: clean as ModelMessage[],
          tools: conciergeTools,
          stopWhen: stepCountIs(6),
          temperature: 0.6,
        })

        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            if (part.text) {
              gotText = true
              controller.enqueue(line({ t: 'd', v: part.text }))
            }
          } else if (part.type === 'tool-result') {
            if (CARD_TOOLS.has(part.toolName)) {
              controller.enqueue(line({ t: 'card', name: part.toolName, data: part.output }))
            }
          } else if (part.type === 'error') {
            console.log('[v0] Concierge stream error:', JSON.stringify(part.error).slice(0, 200))
          }
        }
      } catch (err) {
        console.log('[v0] Concierge failed:', err instanceof Error ? err.message : 'unknown')
      }

      // If the model produced no text at all (bad key, timeout, empty), make
      // sure the guest still gets a helpful answer.
      if (!gotText) {
        controller.enqueue(line({ t: 'd', v: fallbackAnswer(lastUser) }))
        controller.enqueue(line({ t: 'err' }))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
