'use client'

import { useState } from 'react'
import { Check, Send, MessageCircle, Loader2, CalendarDays, MapPin } from 'lucide-react'
import { LuxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth/use-auth'
import { whatsappLink, reservationWhatsappMessage } from '@/lib/whatsapp'
import { SLOT_GROUPS } from '@/lib/restaurant-slots'
import type { Reservation } from '@/lib/db/types'

type Confirmed = { reservation: Reservation; table?: { name: string; location: string } }

export function ReservationForm() {
  const { t } = useI18n()
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(2)
  const [time, setTime] = useState('19:00')
  const [openSlots, setOpenSlots] = useState<string[] | null>(null)
  const [checkingSlots, setCheckingSlots] = useState(false)

  const [sent, setSent] = useState<Confirmed | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const field =
    'w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

  // Refresh which slots are free for the chosen date + party size. Called from
  // change handlers (never a data-fetching useEffect).
  async function refreshSlots(nextDate: string, nextGuests: number) {
    if (!nextDate) {
      setOpenSlots(null)
      return
    }
    setCheckingSlots(true)
    try {
      const res = await fetch(`/api/reservations?date=${nextDate}&guests=${nextGuests}`)
      const data = await res.json()
      setOpenSlots(Array.isArray(data.slots) ? data.slots : null)
    } catch {
      setOpenSlots(null)
    } finally {
      setCheckingSlots(false)
    }
  }

  function slotDisabled(slot: string) {
    return openSlots !== null && !openSlots.includes(slot)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const payload = {
      name: String(data.get('name') || ''),
      phone: String(data.get('phone') || ''),
      email: String(data.get('email') || ''),
      date,
      time,
      guests,
      requests: String(data.get('notes') || ''),
    }
    if (!payload.name || !payload.phone || !payload.date || !payload.time) {
      setError(t('reserve.errRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error ?? t('reserve.errGeneric'))
        if (result.code === 'FULLY_BOOKED' && Array.isArray(result.alternatives)) {
          setOpenSlots(result.alternatives)
        }
        return
      }
      setSent({ reservation: result.reservation, table: result.table })
    } catch {
      setError(t('reserve.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    const r = sent.reservation
    const waUrl = whatsappLink(
      reservationWhatsappMessage({
        intro: t('reserve.waIntro'),
        labels: {
          name: t('reserve.name'),
          date: t('reserve.date'),
          time: t('reserve.time'),
          guests: t('reserve.guests'),
          phone: t('reserve.phone'),
          requests: t('reserve.requests'),
          ref: t('reserve.reference'),
        },
        name: r.name,
        date: r.date,
        time: r.time,
        guests: r.guests,
        phone: r.phone,
        requests: r.requests,
        ref: r.ref,
      }),
    )
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-3xl p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-7" />
        </span>
        <h3 className="font-serif text-2xl text-foreground">{t('reserve.confirmedTitle')}</h3>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{t('reserve.reference')}</span>
          <span className="font-mono text-sm font-semibold text-primary">{r.ref}</span>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {r.date} · {r.time} · {r.guests} {t('reserve.guests')}
        </p>
        {sent.table && (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="size-4 text-primary" /> {sent.table.name} · {sent.table.location}
          </p>
        )}
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          {t('reserve.confirmedBody')}
        </p>
        <a href={waUrl} target="_blank" rel="noreferrer" className="w-full max-w-xs">
          <LuxButton variant="success" className="w-full">
            <MessageCircle className="size-4" />
            {t('reserve.sendWhatsApp')}
          </LuxButton>
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass flex flex-col gap-4 rounded-3xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.name')}</span>
          <input name="name" className={field} placeholder={t('reserve.namePlaceholder')} defaultValue={user?.name ?? ''} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.phone')}</span>
          <input name="phone" className={field} placeholder="+977 …" defaultValue={user?.phone ?? ''} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.email')}</span>
          <input type="email" name="email" className={field} placeholder="you@email.com" defaultValue={user?.email ?? ''} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.guests')}</span>
          <select
            name="guests"
            className={field}
            value={guests}
            onChange={(e) => {
              const g = Number(e.target.value)
              setGuests(g)
              refreshSlots(date, g)
            }}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.date')}</span>
          <input
            type="date"
            name="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              refreshSlots(e.target.value, guests)
            }}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('reserve.time')}
            {checkingSlots && <Loader2 className="size-3 animate-spin text-primary" />}
          </span>
          <select name="time" className={field} value={time} onChange={(e) => setTime(e.target.value)}>
            {SLOT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.times.map((tm) => (
                  <option key={tm} value={tm} disabled={slotDisabled(tm)}>
                    {tm}
                    {slotDisabled(tm) ? ` — ${t('reserve.full')}` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('reserve.requests')}</span>
        <textarea name="notes" rows={3} className={field} placeholder={t('reserve.requestsPlaceholder')} />
      </label>
      {error && <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>}
      <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {t('reserve.submit')}
      </LuxButton>
    </form>
  )
}
