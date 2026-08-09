// Lightweight, lazy voice helpers built on the Web Speech API. Everything is
// feature-detected so the concierge degrades gracefully to text on unsupported
// browsers/devices. Nothing here runs until the user opts into voice.

export type VoiceLang = 'en' | 'ne'

export function speechRecognitionSupported() {
  if (typeof window === 'undefined') return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function speechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

type RecognizerHandlers = {
  onResult: (text: string) => void
  onEnd: () => void
  onError?: (err: string) => void
}

export function createRecognizer(lang: VoiceLang, handlers: RecognizerHandlers) {
  if (!speechRecognitionSupported()) return null
  const Ctor =
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = new (Ctor as any)()
  rec.lang = lang === 'ne' ? 'ne-NP' : 'en-US'
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.continuous = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rec.onresult = (e: any) => {
    const text = e.results?.[0]?.[0]?.transcript ?? ''
    if (text) handlers.onResult(text)
  }
  rec.onend = () => handlers.onEnd()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rec.onerror = (e: any) => handlers.onError?.(e?.error ?? 'error')
  return rec as { start: () => void; stop: () => void; abort: () => void }
}

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!speechSynthesisSupported()) return resolve([])
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      cachedVoices = existing
      return resolve(existing)
    }
    const handler = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
    window.speechSynthesis.onvoiceschanged = handler
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500)
  })
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: VoiceLang) {
  const prefix = lang === 'ne' ? 'ne' : 'en'
  const byLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(prefix))
  const pool = byLang.length ? byLang : voices
  // Prefer a natural female voice where identifiable.
  const femaleHints = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'google', 'aria', 'jenny', 'zira']
  const female = pool.find((v) => femaleHints.some((h) => v.name.toLowerCase().includes(h)))
  return female ?? pool[0] ?? null
}

export async function speak(text: string, lang: VoiceLang) {
  if (!speechSynthesisSupported() || !text.trim()) return
  const voices = cachedVoices.length ? cachedVoices : await loadVoices()
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(voices, lang)
  if (voice) utter.voice = voice
  utter.lang = lang === 'ne' ? 'ne-NP' : 'en-US'
  utter.rate = 1
  utter.pitch = 1.05
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if (speechSynthesisSupported()) window.speechSynthesis.cancel()
}
