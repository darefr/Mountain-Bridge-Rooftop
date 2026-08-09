'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  CalendarDays,
  Users,
  BedDouble,
  Check,
  Loader2,
  Tag,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { LuxButton } from '@/components/ui/lux-button'
import { bookingCacheKey } from '@/components/booking/booking-confirmation-fallback'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth/use-auth'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AvailabilityRow, Quote } from '@/lib/booking'

const field =
  'w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

type PayMethod = 'pay_at_hotel' | 'esewa' | 'khalti' | 'fonepay'

export function BookingFlow() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [checkIn, setCheckIn] = useState(search.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(search.get('checkOut') ?? '')
  const [guests, setGuests] = useState(Number(search.get('guests')) || 2)
  const [roomsWanted, setRoomsWanted] = useState(Number(search.get('rooms')) || 1)
  const [currency, setCurrency] = useState<'USD' | 'NPR'>('USD')

  const [availability, setAvailability] = useState<AvailabilityRow[] | null>(null)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [selected, setSelected] = useState<string | null>(search.get('room'))

  const [coupon, setCoupon] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('pay_at_hotel')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setGuestName((v) => v || user.name)
      setGuestEmail((v) => v || user.email)
      setGuestPhone((v) => v || user.phone || '')
    }
  }, [user])

  const selectedRoom = useMemo(
    () => availability?.find((r) => r.slug === selected) ?? null,
    [availability, selected],
  )

  async function checkAvailability() {
    setError('')
    if (!checkIn || !checkOut) return setError(t('booking.errDates'))
    if (checkOut <= checkIn) return setError(t('booking.errOrder'))
    setLoadingAvail(true)
    try {
      const res = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`)
      const data = await res.json()
      setAvailability(data.rooms)
      setStep(2)
    } catch {
      setError(t('booking.errGeneric'))
    } finally {
      setLoadingAvail(false)
    }
  }

  async function refreshQuote(code?: string) {
    if (!selected) return
    setLoadingQuote(true)
    try {
      const res = await fetch('/api/bookings/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomSlug: selected, checkIn, checkOut, rooms: roomsWanted, currency, couponCode: code ?? coupon }),
      })
      const data = await res.json()
      setQuote(data.quote)
    } finally {
      setLoadingQuote(false)
    }
  }

  useEffect(() => {
    if (step === 3 && selected) refreshQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selected, currency, roomsWanted])

  function selectRoom(slug: string) {
    setSelected(slug)
    setStep(3)
  }

  async function submit() {
    setError('')
    if (!guestName || !guestEmail) return setError(t('booking.errGuest'))
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomSlug: selected,
          checkIn,
          checkOut,
          rooms: roomsWanted,
          guests,
          currency,
          couponCode: quote?.couponCode,
          guestName,
          guestEmail,
          guestPhone,
          paymentMethod: payMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('booking.errGeneric'))
        if (data.code === 'SOLD_OUT') {
          setStep(2)
          checkAvailability()
        }
        return
      }
      const booking = data.booking
      // Hand the freshly-created booking to the confirmation screen so it can
      // render immediately even if a warm serverless instance can't yet see the
      // record in durable storage (prevents a post-booking 404). This is the
      // REAL booking the server returned after persisting it — not a fabrication.
      try {
        sessionStorage.setItem(
          bookingCacheKey(booking.ref),
          JSON.stringify({ booking, roomImage: selectedRoom?.image }),
        )
      } catch {
        /* sessionStorage unavailable — the server render will still handle it */
      }
      if (payMethod === 'pay_at_hotel') {
        router.push(`/booking/${booking.ref}`)
        return
      }
      // Kick off online payment.
      const payRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, provider: payMethod }),
      })
      const payData = await payRes.json()
      if (payData.gatewayUrl) {
        window.location.href = payData.gatewayUrl
      } else {
        router.push(`/booking/${booking.ref}`)
      }
    } catch {
      setError(t('booking.errGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [t('booking.stepDates'), t('booking.stepRoom'), t('booking.stepReview')]

  return (
    <div className="mx-auto max-w-3xl">
      {/* stepper */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  step >= n ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground',
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-background/30 text-[0.65rem]">
                  {step > n ? <Check className="size-3" /> : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {n < steps.length && <ChevronRight className="size-4 text-muted-foreground" />}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 — DATES */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-strong rounded-3xl p-6 sm:p-8"
          >
            <h2 className="font-serif text-2xl text-foreground">{t('booking.whenTitle')}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="size-3.5" /> {t('booking.checkIn')}
                </span>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="size-3.5" /> {t('booking.checkOut')}
                </span>
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Users className="size-3.5" /> {t('booking.guests')}
                </span>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={field}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <BedDouble className="size-3.5" /> {t('booking.rooms')}
                </span>
                <select value={roomsWanted} onChange={(e) => setRoomsWanted(Number(e.target.value))} className={field}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            {error && <p className="mt-4 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div className="mt-6">
              <LuxButton variant="luxury" className="w-full" onClick={checkAvailability} disabled={loadingAvail}>
                {loadingAvail ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                {t('booking.findRooms')}
              </LuxButton>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — ROOM SELECTION */}
        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" /> {t('booking.changeDates')}
            </button>
            {availability?.map((room) => {
              const soldOut = room.available < roomsWanted
              const price = currency === 'NPR' ? Math.round(room.priceUSD * 133) : room.priceUSD
              return (
                <div key={room.slug} className={cn('glass-strong flex flex-col gap-4 rounded-3xl p-4 sm:flex-row', soldOut && 'opacity-60')}>
                  <div className="relative h-40 w-full overflow-hidden rounded-2xl sm:h-auto sm:w-48 shrink-0">
                    <Image src={room.image || '/placeholder.svg'} alt={room.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-serif text-xl text-foreground">{room.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" /> {t('booking.upTo')} {room.maxGuests} · {room.available} {t('booking.available')}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div>
                        <span className="font-serif text-2xl text-foreground">{money(price, currency)}</span>
                        <span className="text-xs text-muted-foreground"> / {t('booking.night')}</span>
                      </div>
                      <LuxButton variant={soldOut ? 'ghost' : 'luxury'} size="sm" disabled={soldOut} onClick={() => selectRoom(room.slug)}>
                        {soldOut ? t('booking.soldOut') : t('booking.select')}
                      </LuxButton>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* STEP 3 — REVIEW + GUEST + PAYMENT */}
        {step === 3 && selectedRoom && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            <div className="space-y-5 lg:col-span-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="size-4" /> {t('booking.changeRoom')}
              </button>

              <div className="glass-strong rounded-3xl p-5">
                <h3 className="font-serif text-lg text-foreground">{t('booking.guestDetails')}</h3>
                <div className="mt-4 grid gap-3">
                  <input placeholder={t('booking.fullName')} value={guestName} onChange={(e) => setGuestName(e.target.value)} className={field} />
                  <input type="email" placeholder={t('booking.email')} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={field} />
                  <input placeholder={t('booking.phone')} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={field} />
                </div>
              </div>

              <div className="glass-strong rounded-3xl p-5">
                <h3 className="font-serif text-lg text-foreground">{t('booking.payment')}</h3>
                <div className="mt-4 grid gap-2.5">
                  {([
                    { id: 'pay_at_hotel', label: t('booking.payAtHotel'), icon: Wallet },
                    { id: 'esewa', label: 'eSewa', icon: ShieldCheck },
                    { id: 'khalti', label: 'Khalti', icon: ShieldCheck },
                    { id: 'fonepay', label: 'Fonepay', icon: ShieldCheck },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                        payMethod === m.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border/70 text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      <m.icon className="size-4" />
                      {m.label}
                      {payMethod === m.id && <Check className="ml-auto size-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* summary */}
            <div className="lg:col-span-2">
              <div className="glass-strong sticky top-24 rounded-3xl p-5">
                <h3 className="font-serif text-lg text-foreground">{selectedRoom.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {checkIn} → {checkOut} · {roomsWanted} {t('booking.rooms')} · {guests} {t('booking.guests')}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setCurrency(currency === 'USD' ? 'NPR' : 'USD')}
                    className="glass rounded-full px-3 py-1 text-xs text-foreground"
                  >
                    {currency === 'USD' ? 'USD → NPR' : 'NPR → USD'}
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      placeholder={t('booking.coupon')}
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className={cn(field, 'pl-8')}
                    />
                  </div>
                  <LuxButton variant="outline" size="sm" onClick={() => refreshQuote()}>
                    {t('booking.apply')}
                  </LuxButton>
                </div>
                {quote?.couponMessage && (
                  <p className={cn('mt-2 text-xs', quote.couponValid ? 'text-success' : 'text-destructive')}>{quote.couponMessage}</p>
                )}

                <div className="mt-5 space-y-2 border-t border-border/50 pt-4 text-sm">
                  {loadingQuote || !quote ? (
                    <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      <Row label={`${money(quote.nightlyUSD, currency)} × ${quote.nights} ${t('booking.nights')} × ${quote.rooms}`} value={money(quote.subtotal, currency)} />
                      {quote.discount > 0 && <Row label={t('booking.discount')} value={`− ${money(quote.discount, currency)}`} accent />}
                      <Row label={`${t('booking.taxService')} (23%)`} value={money(quote.tax + quote.service, currency)} muted />
                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="font-serif text-base text-foreground">{t('booking.total')}</span>
                        <span className="font-serif text-2xl text-primary">{money(quote.total, currency)}</span>
                      </div>
                    </>
                  )}
                </div>

                {error && <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>}

                <LuxButton variant="luxury" className="mt-5 w-full" onClick={submit} disabled={submitting || loadingQuote}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {payMethod === 'pay_at_hotel' ? t('booking.confirmBooking') : t('booking.payNow')}
                </LuxButton>
                <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">{t('booking.securedNote')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-muted-foreground', muted && 'text-xs')}>{label}</span>
      <span className={cn('text-foreground', accent && 'text-success')}>{value}</span>
    </div>
  )
}
