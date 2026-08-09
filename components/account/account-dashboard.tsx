'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  User as UserIcon,
  CalendarDays,
  Bell,
  FileText,
  LogOut,
  BadgeCheck,
  ShieldAlert,
  ShieldCheck,
  Check,
  CreditCard,
  UtensilsCrossed,
  Star,
  Camera,
  Trash2,
  Heart,
  XCircle,
  MessageCircle,
  Settings2,
} from 'lucide-react'
import { LuxButton, LuxLink } from '@/components/ui/lux-button'
import { BookingTimeline } from '@/components/account/booking-timeline'
import { PasswordStrength } from '@/components/auth/password-strength'
import { useAuth } from '@/lib/auth/use-auth'
import { useI18n } from '@/lib/i18n/context'
import { money, formatDate, formatDateTime } from '@/lib/format'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'
import type {
  Booking,
  Notification,
  Reservation,
  NotificationPrefs,
  WishlistItem,
  EmergencyContact,
} from '@/lib/db/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Tab =
  | 'overview'
  | 'bookings'
  | 'reservations'
  | 'wishlist'
  | 'payments'
  | 'invoices'
  | 'reviews'
  | 'notifications'
  | 'profile'
  | 'security'

type PaymentRow = {
  id: string
  provider: string
  amount: number
  currency: 'NPR'
  status: string
  createdAt: number
  verifiedAt?: number
  bookingRef?: string
  roomName?: string
}

type ReviewRow = {
  id: string
  text: string
  rating: number
  trip: string
  approved: boolean
  createdAt: number
}

const today = () => new Date().toISOString().split('T')[0]

export function AccountDashboard() {
  const { t, locale } = useI18n()
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/account')
  }, [isLoading, user, router])

  const { data: bookingsData, mutate: mutateBookings } = useSWR<{ bookings: Booking[] }>(
    user ? '/api/account/bookings' : null,
    fetcher,
  )
  const { data: notifData, mutate: mutateNotif } = useSWR<{ notifications: Notification[] }>(
    user ? '/api/account/notifications' : null,
    fetcher,
  )

  if (isLoading || !user) {
    return (
      <div className="container-luxe flex min-h-[60vh] items-center justify-center pt-32">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  const bookings = bookingsData?.bookings ?? []
  const notifications = notifData?.notifications ?? []
  const unread = notifications.filter((n) => !n.read).length

  const tabs: { id: Tab; label: string; icon: typeof UserIcon; badge?: number }[] = [
    { id: 'overview', label: t('account.overview'), icon: UserIcon },
    { id: 'bookings', label: t('account.bookings'), icon: CalendarDays },
    { id: 'reservations', label: t('account.reservations'), icon: UtensilsCrossed },
    { id: 'wishlist', label: t('account.wishlist'), icon: Heart },
    { id: 'payments', label: t('account.payments'), icon: CreditCard },
    { id: 'invoices', label: t('account.invoices'), icon: FileText },
    { id: 'reviews', label: t('account.reviews'), icon: Star },
    { id: 'notifications', label: t('account.notifications'), icon: Bell, badge: unread },
    { id: 'profile', label: t('account.profile'), icon: UserIcon },
    { id: 'security', label: t('account.security'), icon: ShieldCheck },
  ]

  async function markAll() {
    await fetch('/api/account/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    mutateNotif()
  }

  return (
    <section className="container-luxe min-h-screen pb-24 pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} />
          <div>
            <span className="eyebrow mb-3">
              <span className="h-px w-6 bg-primary/70" aria-hidden />
              {t('account.title')}
            </span>
            <h1 className="font-serif text-3xl font-light text-foreground sm:text-4xl">
              {t('account.welcome')}, {user.name}
            </h1>
          </div>
        </div>
        <LuxButton variant="glass" size="sm" onClick={() => logout().then(() => router.push('/'))}>
          <LogOut className="size-4" />
          {t('common.signOut')}
        </LuxButton>
      </div>

      {!user.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            {t('account.verifyBanner')}
          </span>
          <LuxLink href="/verify-email" variant="luxury" size="sm">
            {t('auth.verifyButton')}
          </LuxLink>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="glass flex gap-1 overflow-x-auto rounded-2xl p-2 lg:flex-col">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                tab === tb.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:bg-primary/10',
              )}
            >
              <tb.icon className="size-4" />
              {tb.label}
              {tb.badge ? (
                <span className="ml-auto grid size-5 place-items-center rounded-full bg-destructive text-[0.65rem] text-primary-foreground">
                  {tb.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'overview' && <Overview user={user} bookings={bookings} />}
          {tab === 'bookings' && (
            <BookingsSection
              bookings={bookings}
              locale={locale}
              onChanged={() => mutateBookings()}
            />
          )}
          {tab === 'reservations' && <ReservationsSection enabled={!!user} locale={locale} />}
          {tab === 'wishlist' && <WishlistSection enabled={!!user} locale={locale} />}
          {tab === 'payments' && <PaymentsSection enabled={!!user} locale={locale} />}
          {tab === 'invoices' && <InvoicesList bookings={bookings} locale={locale} />}
          {tab === 'reviews' && <ReviewsSection enabled={!!user} locale={locale} />}
          {tab === 'notifications' && (
            <NotificationsList notifications={notifications} onMarkAll={markAll} locale={locale} />
          )}
          {tab === 'profile' && <ProfileForm />}
          {tab === 'security' && <SecuritySection />}
        </div>
      </div>
    </section>
  )
}

function Avatar({ name, image }: { name: string; image?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (image) {
    return (
      <span className="relative size-14 overflow-hidden rounded-full ring-1 ring-primary/30">
        {/* Uses a plain img: profile photos can be data URLs which next/image rejects. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/placeholder.svg'} alt={name} className="size-full object-cover" />
      </span>
    )
  }
  return (
    <span className="grid size-14 place-items-center rounded-full bg-primary/15 font-serif text-lg text-primary ring-1 ring-primary/30">
      {initials || 'MB'}
    </span>
  )
}

function Overview({
  user,
  bookings,
}: {
  user: { name: string; email: string; createdAt: number; emailVerified: boolean }
  bookings: Booking[]
}) {
  const { t, locale } = useI18n()
  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && b.checkIn >= today(),
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('common.email')}</p>
        <p className="mt-1 flex items-center gap-2 text-foreground">
          {user.email}
          {user.emailVerified && <BadgeCheck className="size-4 text-success" />}
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          {t('account.memberSince')}
        </p>
        <p className="mt-1 text-foreground">{formatDate(user.createdAt, locale)}</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('account.upcomingStay')}
        </p>
        {upcoming[0] ? (
          <div className="mt-1">
            <p className="font-serif text-lg text-foreground">{upcoming[0].roomName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(upcoming[0].checkIn, locale)} → {formatDate(upcoming[0].checkOut, locale)}
            </p>
            <p className="mt-1 text-xs text-primary">{upcoming[0].ref}</p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{t('account.noBookings')}</p>
        )}
        <LuxLink href="/book" variant="luxury" size="sm" className="mt-4">
          {t('common.bookNow')}
        </LuxLink>
      </div>
    </div>
  )
}

const statusColor: Record<string, string> = {
  confirmed: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  checked_in: 'bg-primary/15 text-primary',
  checked_out: 'bg-primary/15 text-primary',
  pending: 'bg-primary/15 text-primary',
  cancelled: 'bg-destructive/15 text-destructive',
  no_show: 'bg-destructive/15 text-destructive',
}

type BookingFilter = 'upcoming' | 'current' | 'history' | 'cancelled'

function BookingsSection({
  bookings,
  locale,
  onChanged,
}: {
  bookings: Booking[]
  locale: string
  onChanged: () => void
}) {
  const { t } = useI18n()
  const [filter, setFilter] = useState<BookingFilter>('upcoming')
  const [cancelingRef, setCancelingRef] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState('')
  const d = today()

  async function cancelBooking(ref: string) {
    if (!window.confirm(t('account.confirmCancel'))) return
    setCancelError('')
    setCancelingRef(ref)
    const res = await fetch(`/api/bookings/${ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    const json = await res.json().catch(() => ({}))
    setCancelingRef(null)
    if (!res.ok) {
      setCancelError(json.error || 'Could not cancel booking.')
      return
    }
    onChanged()
  }

  const groups = useMemo(() => {
    const upcoming: Booking[] = []
    const current: Booking[] = []
    const history: Booking[] = []
    const cancelled: Booking[] = []
    for (const b of bookings) {
      if (b.status === 'cancelled' || b.status === 'no_show') cancelled.push(b)
      else if (b.status === 'completed' || b.checkOut < d) history.push(b)
      else if (b.status === 'checked_in' || (b.checkIn <= d && b.checkOut >= d)) current.push(b)
      else upcoming.push(b)
    }
    return { upcoming, current, history, cancelled }
  }, [bookings, d])

  const filters: { id: BookingFilter; label: string; count: number }[] = [
    { id: 'upcoming', label: t('account.upcoming'), count: groups.upcoming.length },
    { id: 'current', label: t('account.current'), count: groups.current.length },
    { id: 'history', label: t('account.history'), count: groups.history.length },
    { id: 'cancelled', label: t('account.cancelled'), count: groups.cancelled.length },
  ]
  const list = groups[filter]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs transition-colors',
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'glass text-foreground/80 hover:text-foreground',
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {!list.length ? (
        <Empty text={t('account.noBookings')} />
      ) : (
        list.map((b) => (
          <div key={b.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-serif text-lg text-foreground">{b.roomName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(b.checkIn, locale)} → {formatDate(b.checkOut, locale)} · {b.nights}{' '}
                  {t('common.nights')} · {b.rooms} {t('common.room')}
                </p>
                <p className="mt-1 text-xs text-primary">
                  {t('account.bookingRef')}: {b.ref}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    statusColor[b.status] ?? 'bg-primary/15 text-primary',
                  )}
                >
                  {b.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-foreground">{money(b.total, b.currency)}</span>
                <Link
                  href={`/account/invoices/${b.ref}`}
                  className="text-xs text-primary hover:underline"
                >
                  {t('account.viewInvoice')}
                </Link>
              </div>
            </div>
            {b.status !== 'cancelled' && b.status !== 'no_show' && <BookingTimeline booking={b} />}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
              <Link
                href={`/account/bookings/${b.ref}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
              >
                <Settings2 className="size-3.5" />
                {t('account.requestChange')}
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp.split('/').pop()}?text=${encodeURIComponent(
                  `Hello, this is regarding my booking ${b.ref} (${b.roomName}, ${b.checkIn} → ${b.checkOut}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:text-foreground"
              >
                <MessageCircle className="size-3.5 text-primary" />
                WhatsApp
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(`Booking ${b.ref}`)}`}
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:text-foreground"
              >
                {t('account.contactHotel')}
              </a>
              {filter === 'history' && b.status !== 'cancelled' && (
                <Link
                  href="/account?tab=reviews"
                  onClick={(e) => {
                    e.preventDefault()
                    document
                      .getElementById('write-review-anchor')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:text-foreground"
                >
                  <Star className="size-3.5 text-primary" />
                  {t('account.leaveReview')}
                </Link>
              )}
              {(filter === 'upcoming' || filter === 'current') &&
                b.status !== 'cancelled' &&
                b.status !== 'checked_in' && (
                  <button
                    onClick={() => cancelBooking(b.ref)}
                    disabled={cancelingRef === b.ref}
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-60"
                  >
                    <XCircle className="size-3.5" />
                    {cancelingRef === b.ref ? t('common.loading') : t('account.cancelBooking')}
                  </button>
                )}
            </div>
            {cancelError && cancelingRef === null && (
              <p className="mt-2 text-xs text-destructive">{cancelError}</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function ReservationsSection({ enabled, locale }: { enabled: boolean; locale: string }) {
  const { t } = useI18n()
  const { data, mutate } = useSWR<{ reservations: Reservation[] }>(
    enabled ? '/api/account/reservations' : null,
    fetcher,
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const reservations = data?.reservations ?? []

  async function cancel(id: string) {
    if (!window.confirm(t('account.confirmCancel'))) return
    setError('')
    setBusyId(id)
    const res = await fetch('/api/account/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    })
    const json = await res.json().catch(() => ({}))
    setBusyId(null)
    if (!res.ok) {
      setError(json.error || 'Could not cancel reservation.')
      return
    }
    mutate()
  }

  if (!reservations.length) return <Empty text={t('account.noReservations')} />
  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-destructive">{error}</p>}
      {reservations.map((r) => {
        const cancellable = r.status === 'pending' || r.status === 'confirmed'
        return (
          <div
            key={r.id}
            className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
          >
            <div>
              <p className="flex items-center gap-2 font-serif text-lg text-foreground">
                <UtensilsCrossed className="size-4 text-primary" />
                {formatDate(r.date, locale)} · {r.time}
              </p>
              <p className="text-sm text-muted-foreground">
                {r.guests} {t('common.guests')} · {r.ref}
              </p>
              {r.requests && <p className="mt-1 text-xs text-muted-foreground">{r.requests}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium capitalize',
                  r.status === 'cancelled'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-success/15 text-success',
                )}
              >
                {r.status}
              </span>
              {cancellable && (
                <button
                  onClick={() => cancel(r.id)}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-60"
                >
                  <XCircle className="size-3.5" />
                  {busyId === r.id ? t('common.loading') : t('account.cancelReservation')}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WishlistSection({ enabled, locale }: { enabled: boolean; locale: string }) {
  const { t } = useI18n()
  const { data, mutate } = useSWR<{ wishlist: WishlistItem[] }>(
    enabled ? '/api/account/wishlist' : null,
    fetcher,
  )
  const items = data?.wishlist ?? []

  async function remove(id: string) {
    await fetch(`/api/account/wishlist?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    mutate()
  }

  if (!items.length) return <Empty text={t('account.noWishlist')} />
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.id} className="glass overflow-hidden rounded-2xl">
          {it.image && (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image || '/placeholder.svg'} alt={it.title} className="size-full object-cover" />
            </div>
          )}
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-serif text-lg text-foreground">{it.title}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {it.kind}
                {it.meta ? ` · ${it.meta}` : ''} · {formatDate(it.addedAt, locale)}
              </p>
              {it.href && (
                <Link href={it.href} className="mt-1 inline-block text-xs text-primary hover:underline">
                  {t('common.bookNow')}
                </Link>
              )}
            </div>
            <button
              onClick={() => remove(it.id)}
              aria-label={t('account.removeFromWishlist')}
              className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentsSection({ enabled, locale }: { enabled: boolean; locale: string }) {
  const { t } = useI18n()
  const { data } = useSWR<{ payments: PaymentRow[] }>(
    enabled ? '/api/account/payments' : null,
    fetcher,
  )
  const payments = data?.payments ?? []
  if (!payments.length) return <Empty text={t('account.noPayments')} />
  return (
    <div className="flex flex-col gap-3">
      {payments.map((p) => (
        <div
          key={p.id}
          className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
        >
          <div>
            <p className="flex items-center gap-2 font-medium text-foreground">
              <CreditCard className="size-4 text-primary" />
              {p.roomName ?? p.bookingRef ?? '—'}
            </p>
            <p className="text-sm capitalize text-muted-foreground">
              {p.provider} · {formatDateTime(p.createdAt, locale)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm text-foreground">{money(p.amount, p.currency)}</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium',
                p.status === 'paid'
                  ? 'bg-success/15 text-success'
                  : p.status === 'failed'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-primary/15 text-primary',
              )}
            >
              {p.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function InvoicesList({ bookings, locale }: { bookings: Booking[]; locale: string }) {
  const { t } = useI18n()
  const invoiced = bookings.filter((b) => b.status !== 'cancelled')
  if (!invoiced.length) return <Empty text={t('account.noInvoices')} />
  return (
    <div className="flex flex-col gap-3">
      {invoiced.map((b) => (
        <div
          key={b.id}
          className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
        >
          <div>
            <p className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="size-4 text-primary" />
              {b.ref}
            </p>
            <p className="text-sm text-muted-foreground">
              {b.roomName} · {formatDate(b.createdAt, locale)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground">{money(b.total, b.currency)}</span>
            <Link
              href={`/account/invoices/${b.ref}`}
              className="text-xs text-primary hover:underline"
            >
              {t('account.viewInvoice')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewsSection({ enabled, locale }: { enabled: boolean; locale: string }) {
  const { t } = useI18n()
  const { data, mutate } = useSWR<{ reviews: ReviewRow[] }>(
    enabled ? '/api/account/reviews' : null,
    fetcher,
  )
  const reviews = data?.reviews ?? []
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [trip, setTrip] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await fetch('/api/account/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, text, trip }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(json.error || 'Could not submit review')
      return
    }
    setText('')
    setTrip('')
    setRating(5)
    mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        id="write-review-anchor"
        onSubmit={submit}
        className="glass flex flex-col gap-4 rounded-2xl p-6"
      >
        <p className="text-sm font-medium text-foreground">{t('account.writeReview')}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'size-6 transition-colors',
                  n <= rating ? 'fill-primary text-primary' : 'text-border',
                )}
              />
            </button>
          ))}
        </div>
        <input
          value={trip}
          onChange={(e) => setTrip(e.target.value)}
          placeholder="Trip type (e.g. Trekking, Family)"
          className="w-full rounded-xl border border-border/70 bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('account.reviewPlaceholder')}
          rows={3}
          className="w-full resize-none rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <LuxButton type="submit" variant="luxury" size="sm" disabled={busy} className="self-start">
          <Star className="size-4" />
          {busy ? t('common.loading') : t('account.submitReview')}
        </LuxButton>
      </form>

      {!reviews.length ? (
        <Empty text={t('account.noReviews')} />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'size-4',
                        i < r.rating ? 'fill-primary text-primary' : 'text-border',
                      )}
                    />
                  ))}
                </div>
                {!r.approved && (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.65rem] text-primary">
                    {t('account.reviewPending')}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground/90">{r.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt, locale)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationsList({
  notifications,
  onMarkAll,
  locale,
}: {
  notifications: Notification[]
  onMarkAll: () => void
  locale: string
}) {
  const { t } = useI18n()
  if (!notifications.length) return <Empty text={t('account.noNotifications')} />
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <LuxButton variant="ghost" size="sm" onClick={onMarkAll}>
          {t('account.markAllRead')}
        </LuxButton>
      </div>
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn('glass rounded-2xl p-4', !n.read && 'border-primary/40 ring-1 ring-primary/20')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-foreground">{n.title}</p>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(n.createdAt, locale)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
        </div>
      ))}
    </div>
  )
}

const field =
  'w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'
const labelCls =
  'flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground'

function ProfileForm() {
  const { t, setLocale } = useI18n()
  const { user, refresh } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [country, setCountry] = useState(user?.country ?? '')
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ne'>(
    user?.preferredLanguage ?? 'en',
  )
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'NPR'>(
    user?.preferredCurrency ?? 'USD',
  )
  const [emergency, setEmergency] = useState<EmergencyContact>(
    user?.emergencyContact ?? { name: '', phone: '', relation: '' },
  )
  const [image, setImage] = useState<string | undefined>(user?.image)
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    user?.notifyPrefs ?? { bookingEmails: true, reservationEmails: true, promoEmails: false },
  )
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 512 * 1024) {
      setError('Image is too large (max 512KB).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setError('')
    setBusy(true)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        country,
        preferredLanguage,
        preferredCurrency,
        emergencyContact: emergency,
        image: image ?? '',
        notifyPrefs: prefs,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(json.error || 'Update failed')
      return
    }
    setMsg(t('account.profileSaved'))
    setCurrentPassword('')
    setNewPassword('')
    // Apply the chosen language immediately for the logged-in session.
    setLocale(preferredLanguage)
    refresh()
  }

  const prefRows: { key: keyof NotificationPrefs; label: string }[] = [
    { key: 'bookingEmails', label: t('account.prefBooking') },
    { key: 'reservationEmails', label: t('account.prefReservation') },
    { key: 'promoEmails', label: t('account.prefPromo') },
  ]

  return (
    <form onSubmit={save} className="glass flex max-w-lg flex-col gap-5 rounded-2xl p-6">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <Avatar name={name || 'MB'} image={image} />
        <div className="flex flex-col gap-2">
          <span className={labelCls}>{t('account.profilePhoto')}</span>
          <div className="flex gap-2">
            <LuxButton
              type="button"
              variant="glass"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" />
              {t('account.changePhoto')}
            </LuxButton>
            {image && (
              <LuxButton type="button" variant="ghost" size="sm" onClick={() => setImage(undefined)}>
                <Trash2 className="size-4" />
                {t('account.removePhoto')}
              </LuxButton>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickImage}
          />
        </div>
      </div>

      <label className={labelCls}>
        {t('common.fullName')}
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className={labelCls}>
        {t('common.phone')}
        <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className={labelCls}>
        {t('account.country')}
        <input
          className={field}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          autoComplete="country-name"
        />
      </label>

      {/* Preferences: language + currency */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          {t('account.preferredLanguage')}
          <select
            className={field}
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'ne')}
          >
            <option value="en">English</option>
            <option value="ne">नेपाली</option>
          </select>
        </label>
        <label className={labelCls}>
          {t('account.preferredCurrency')}
          <select
            className={field}
            value={preferredCurrency}
            onChange={(e) => setPreferredCurrency(e.target.value as 'USD' | 'NPR')}
          >
            <option value="USD">USD ($)</option>
            <option value="NPR">NPR (रू)</option>
          </select>
        </label>
      </div>

      {/* Emergency contact (optional) */}
      <div className="border-t border-border/50 pt-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          {t('account.emergencyContact')}{' '}
          <span className="text-xs font-normal text-muted-foreground">({t('account.optional')})</span>
        </p>
        <div className="flex flex-col gap-4">
          <label className={labelCls}>
            {t('account.emergencyName')}
            <input
              className={field}
              value={emergency.name ?? ''}
              onChange={(e) => setEmergency((c) => ({ ...c, name: e.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>
              {t('account.emergencyPhone')}
              <input
                className={field}
                value={emergency.phone ?? ''}
                onChange={(e) => setEmergency((c) => ({ ...c, phone: e.target.value }))}
              />
            </label>
            <label className={labelCls}>
              {t('account.emergencyRelation')}
              <input
                className={field}
                value={emergency.relation ?? ''}
                onChange={(e) => setEmergency((c) => ({ ...c, relation: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="border-t border-border/50 pt-4">
        <p className="mb-3 text-sm font-medium text-foreground">{t('account.notificationPrefs')}</p>
        <div className="flex flex-col gap-2.5">
          {prefRows.map((row) => (
            <label
              key={row.key}
              className="flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground/90"
            >
              {row.label}
              <input
                type="checkbox"
                checked={prefs[row.key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [row.key]: e.target.checked }))}
                className="size-4 rounded border-border/70 bg-background/40 accent-primary"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Password */}
      <div className="border-t border-border/50 pt-4">
        <p className="mb-3 text-sm font-medium text-foreground">{t('account.changePassword')}</p>
        <div className="flex flex-col gap-4">
          <label className={labelCls}>
            {t('account.currentPassword')}
            <input
              type="password"
              className={field}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className={labelCls}>
            {t('auth.newPassword')}
            <input
              type="password"
              className={field}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {newPassword && <PasswordStrength password={newPassword} />}
        </div>
      </div>

      {msg && <p className="rounded-lg bg-success/15 px-3 py-2 text-xs text-success">{msg}</p>}
      {error && <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>}
      <LuxButton type="submit" variant="luxury" disabled={busy}>
        <Check className="size-4" />
        {t('account.saveChanges')}
      </LuxButton>
    </form>
  )
}

function SecuritySection() {
  const { t } = useI18n()
  const { logoutAll } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onLogoutAll() {
    setBusy(true)
    await logoutAll()
    router.push('/login')
  }

  return (
    <div className="glass flex max-w-lg flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <p className="text-sm font-medium text-foreground">{t('account.logoutAll')}</p>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{t('account.logoutAllDesc')}</p>
      <LuxButton
        type="button"
        variant="danger"
        size="md"
        className="self-start"
        onClick={onLogoutAll}
        disabled={busy}
      >
        <LogOut className="size-4" />
        {busy ? t('common.loading') : t('account.logoutAll')}
      </LuxButton>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="glass flex min-h-[200px] items-center justify-center rounded-2xl p-8 text-center text-muted-foreground">
      {text}
    </div>
  )
}
