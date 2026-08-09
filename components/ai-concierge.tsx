'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Sparkles,
  X,
  Send,
  Mountain,
  Mic,
  Volume2,
  VolumeX,
  MessageCircle,
  BedDouble,
  UtensilsCrossed,
  Trash2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { whatsappLink } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { ConciergeCard, type ConciergeCardData } from '@/components/concierge/cards'

type Msg = { role: 'user' | 'assistant'; content: string; cards?: ConciergeCardData[] }

// Map a streamed tool result to a renderable card.
function mapCard(name: string, data: unknown): ConciergeCardData | null {
  switch (name) {
    case 'checkRoomAvailability':
      return { kind: 'availability', data: data as never }
    case 'getRooms':
      return { kind: 'rooms', data: data as never }
    case 'getOffers':
      return { kind: 'offers', data: data as never }
    case 'getRestaurantMenu':
      return { kind: 'menu', data: data as never }
    case 'createBookingDraft':
      return { kind: 'bookingDraft', data: data as never }
    case 'createRestaurantReservation':
      return { kind: 'reservation', data: data as never }
    case 'checkRestaurantAvailability':
      return { kind: 'restaurantSlots', data: data as never }
    default:
      return null
  }
}

export function AiConcierge() {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [streaming, setStreaming] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [listening, setListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognizerRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null)

  const greeting = t('concierge.greeting')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' })
  }, [messages, open, streaming])

  // Allow other parts of the site (e.g. the homepage "Chat with AI Concierge"
  // CTA) to open the concierge without changing any existing open behaviour.
  useEffect(() => {
    const openConcierge = () => setOpen(true)
    window.addEventListener('open-concierge', openConcierge)
    return () => window.removeEventListener('open-concierge', openConcierge)
  }, [])

  // Feature-detect mic support lazily once the panel opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    import('@/lib/voice').then((v) => {
      if (!cancelled) setMicSupported(v.speechRecognitionSupported())
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const starterSuggestions = [
    t('concierge.suggest1'),
    t('concierge.suggest2'),
    t('concierge.suggest3'),
    t('concierge.suggest4'),
  ]
  const followUpSuggestions = [
    t('concierge.followUp1'),
    t('concierge.followUp2'),
    t('concierge.followUp3'),
    t('concierge.followUp4'),
  ]

  function updateLast(patch: Partial<Msg>) {
    setMessages((m) => {
      const copy = [...m]
      const last = copy[copy.length - 1]
      if (last) copy[copy.length - 1] = { ...last, ...patch }
      return copy
    })
  }

  async function send(text: string) {
    const q = text.trim()
    if (!q || streaming) return
    const next: Msg[] = [...messages, { role: 'user', content: q }]
    // Only role/content go to the API (cards are UI-only).
    const payload = next.map((m) => ({ role: m.role, content: m.content }))
    setMessages(next)
    setInput('')
    setStreaming(true)
    setMessages((m) => [...m, { role: 'assistant', content: '', cards: [] }])

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      })
      if (!res.body) throw new Error('no body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let acc = ''
      const cards: ConciergeCardData[] = []

      const handleLine = (raw: string) => {
        const trimmed = raw.trim()
        if (!trimmed) return
        let evt: { t: string; v?: string; name?: string; data?: unknown }
        try {
          evt = JSON.parse(trimmed)
        } catch {
          return
        }
        if (evt.t === 'd' && evt.v) {
          acc += evt.v
          updateLast({ content: acc, cards: [...cards] })
        } else if (evt.t === 'card' && evt.name) {
          const c = mapCard(evt.name, evt.data)
          if (c) {
            cards.push(c)
            updateLast({ content: acc, cards: [...cards] })
          }
        }
      }

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let idx
        while ((idx = buffer.indexOf('\n')) >= 0) {
          handleLine(buffer.slice(0, idx))
          buffer = buffer.slice(idx + 1)
        }
      }
      if (buffer) handleLine(buffer)

      if (!acc && cards.length === 0) {
        updateLast({ content: t('concierge.errGeneric') })
      }
      if (voiceOn && acc) {
        const v = await import('@/lib/voice')
        v.speak(acc, locale)
      }
    } catch {
      updateLast({ content: t('concierge.errGeneric') })
    } finally {
      setStreaming(false)
    }
  }

  async function toggleMic() {
    const v = await import('@/lib/voice')
    if (listening) {
      recognizerRef.current?.stop()
      setListening(false)
      return
    }
    const rec = v.createRecognizer(locale, {
      onResult: (text) => {
        setInput('')
        send(text)
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    })
    if (!rec) return
    recognizerRef.current = rec
    setListening(true)
    rec.start()
  }

  async function toggleVoice() {
    const next = !voiceOn
    setVoiceOn(next)
    if (!next) {
      const v = await import('@/lib/voice')
      v.stopSpeaking()
    }
  }

  async function clearChat() {
    const v = await import('@/lib/voice').catch(() => null)
    v?.stopSpeaking()
    setMessages([])
    setInput('')
  }

  // Hand off to a human on WhatsApp with the recent conversation as context.
  function buildHandoffUrl() {
    const transcript = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? '🧑' : '🤖'} ${m.content}`)
      .filter((l) => l.trim().length > 2)
      .join('\n')
    const parts = [t('whatsapp.bookingIntro')]
    if (transcript) {
      parts.push('', `${t('concierge.handoffContext')}:`, transcript)
    }
    return whatsappLink(parts.join('\n'))
  }

  const showStarters = messages.length === 0
  const showFollowUps = !streaming && messages.length > 0

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 18 }}
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-b from-[oklch(0.86_0.11_86)] to-[oklch(0.74_0.1_78)] px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.8_0.1_82_/_55%)] transition-transform hover:-translate-y-0.5',
          open && 'pointer-events-none opacity-0',
        )}
        aria-label={t('concierge.open')}
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">{t('concierge.open')}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong fixed bottom-5 right-5 z-50 flex h-[76vh] max-h-[620px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                  <Mountain className="size-4 text-primary" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-foreground">{t('concierge.name')}</span>
                  <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-success" />
                    {t('concierge.role')} · {t('concierge.online')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                    aria-label={t('concierge.clear')}
                    title={t('concierge.clear')}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button
                  onClick={toggleVoice}
                  className={cn(
                    'grid size-8 place-items-center rounded-full transition-colors hover:bg-foreground/5',
                    voiceOn ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-label={voiceOn ? t('concierge.voiceOff') : t('concierge.voiceOn')}
                  title={voiceOn ? t('concierge.voiceOff') : t('concierge.voiceOn')}
                >
                  {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  aria-label={t('concierge.close')}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {/* greeting bubble */}
              <div className="flex justify-start">
                <div className="glass max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                  {greeting}
                </div>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                  {(m.content || (m.role === 'assistant' && streaming && i === messages.length - 1)) && (
                    <div
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'glass text-foreground',
                      )}
                    >
                      {m.content ||
                        (streaming && i === messages.length - 1 ? t('concierge.thinking') : '')}
                    </div>
                  )}
                  {m.role === 'assistant' && m.cards && m.cards.length > 0 && (
                    <div className="w-full max-w-[92%] space-y-2.5">
                      {m.cards.map((c, ci) => (
                        <ConciergeCard key={ci} card={c} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {showStarters && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {starterSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="glass rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {showFollowUps && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {followUpSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="glass rounded-full px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* quick actions */}
            <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
              <a href="/book" className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/80 hover:text-primary">
                <BedDouble className="size-3.5" /> {t('concierge.bookCta')}
              </a>
              <a href="/restaurant#reserve" className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/80 hover:text-primary">
                <UtensilsCrossed className="size-3.5" /> {t('concierge.reserveCta')}
              </a>
              <a href={buildHandoffUrl()} target="_blank" rel="noreferrer" className="glass ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-success hover:opacity-80" aria-label={t('concierge.handoff')} title={t('concierge.handoff')}>
                <MessageCircle className="size-3.5" />
              </a>
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (e.nativeEvent && (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) return
                send(input)
              }}
              className="flex items-center gap-2 border-t border-border/50 p-3"
            >
              {micSupported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full border transition-colors',
                    listening ? 'border-primary bg-primary/15 text-primary animate-pulse' : 'border-border/70 text-muted-foreground hover:text-primary',
                  )}
                  aria-label={listening ? t('concierge.micStop') : t('concierge.micStart')}
                >
                  <Mic className="size-4" />
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? t('concierge.listening') : t('concierge.placeholder')}
                className="flex-1 rounded-full border border-border/70 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={streaming}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label={t('concierge.send')}
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
