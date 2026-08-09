'use client'

import { useEffect, useState } from 'react'
import { Loader2, SearchX } from 'lucide-react'
import { LuxLink } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { site } from '@/lib/site'
import { BookingConfirmation } from '@/components/booking/booking-confirmation'
import type { Booking } from '@/lib/db/types'

// sessionStorage key used to hand a freshly-created booking to the confirmation
// screen. The booking flow writes it right after a successful POST; this key is
// the single source of truth shared between the two components.
export function bookingCacheKey(ref: string) {
  return `mb_booking_${ref}`
}

type CachedBooking = { booking: Booking; roomImage?: string }

// Client-side resilience layer for the confirmation page.
//
// The server component renders directly from the database whenever it can find
// the booking (the normal path — works in the preview and, once durable storage
// is connected, in production too). When a warm serverless instance briefly
// cannot see a just-created booking, this fallback renders the REAL booking that
// the API returned moments earlier (cached in sessionStorage) so the guest never
// hits a 404, and a same-session refresh keeps working. If no cached booking is
// available it tries the authenticated lookup, and only then shows an honest
// "not found" state — never a fabricated confirmation.
export function BookingConfirmationFallback({ bookingRef }: { bookingRef: string }) {
  const { t } = useI18n()
  const [state, setState] = useState<'loading' | 'found' | 'missing'>('loading')
  const [data, setData] = useState<CachedBooking | null>(null)

  useEffect(() => {
    let active = true

    async function resolve() {
      // 1) The booking the API returned right after creation (same session).
      try {
        const raw = sessionStorage.getItem(bookingCacheKey(bookingRef))
        if (raw) {
          const parsed = JSON.parse(raw) as CachedBooking
          if (parsed?.booking?.ref === bookingRef) {
            if (active) {
              setData(parsed)
              setState('found')
            }
            return
          }
        }
      } catch {
        /* ignore malformed cache */
      }

      // 2) Authenticated owners can still resolve it from the server.
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingRef)}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = (await res.json()) as { booking?: Booking; roomImage?: string }
          if (json?.booking && active) {
            setData({ booking: json.booking, roomImage: json.roomImage })
            setState('found')
            return
          }
        }
      } catch {
        /* fall through to missing */
      }

      if (active) setState('missing')
    }

    resolve()
    return () => {
      active = false
    }
  }, [bookingRef])

  if (state === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (state === 'found' && data) {
    return <BookingConfirmation booking={data.booking} roomImage={data.roomImage} isOwner={false} />
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted/40 text-muted-foreground">
          <SearchX className="size-7" />
        </span>
        <h1 className="font-serif text-2xl text-foreground">{t('booking.notFoundTitle')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('booking.notFoundBody')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('booking.notFoundRef')}{' '}
          <span className="font-mono text-foreground">{bookingRef}</span>
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <LuxLink href="/account/bookings" variant="outline" size="md">
            {t('booking.myBookings')}
          </LuxLink>
          <LuxLink href={site.whatsapp} variant="luxury" size="md">
            {t('booking.contactHotel')}
          </LuxLink>
          <LuxLink href="/" variant="ghost" size="md">
            {t('booking.backHome')}
          </LuxLink>
        </div>
      </div>
    </div>
  )
}
