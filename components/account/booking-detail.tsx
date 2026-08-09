'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import {
  ArrowLeft,
  CalendarDays,
  Users,
  BedDouble,
  Mail,
  Phone,
  UserCircle,
  CreditCard,
  CalendarCheck,
  StickyNote,
  MessageCircle,
  FileText,
  Printer,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Pencil,
} from 'lucide-react'
import { LuxButton, LuxLink, luxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { money, formatDate, formatDateTime } from '@/lib/format'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Booking, BookingChangeRequest, ChangeRequestType } from '@/lib/db/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const paymentMethodLabels: Record<string, string> = {
  pay_at_hotel: 'Pay at hotel',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'Fonepay',
}

const statusStyle: Record<string, string> = {
  confirmed: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  checked_in: 'bg-primary/15 text-primary',
  checked_out: 'bg-primary/15 text-primary',
  pending: 'bg-primary/15 text-primary',
  cancelled: 'bg-destructive/15 text-destructive',
  no_show: 'bg-destructive/15 text-destructive',
}

const crStatusStyle: Record<string, string> = {
  pending: 'bg-primary/15 text-primary',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
}

const crTypeLabel: Record<string, string> = {
  dates: 'Date change',
  room: 'Room change',
  guests: 'Guest count',
  other: 'Other request',
}

type RoomOption = { slug: string; name: string; priceUSD: number; maxGuests: number }

export function BookingDetail({
  booking,
  roomImage,
  roomOptions,
  initialChangeRequests,
}: {
  booking: Booking
  roomImage?: string
  roomOptions: RoomOption[]
  initialChangeRequests: BookingChangeRequest[]
}) {
  const { t, locale } = useI18n()

  const { data, mutate } = useSWR<{ changeRequests: BookingChangeRequest[] }>(
    `/api/account/change-requests?ref=${booking.ref}`,
    fetcher,
    { fallbackData: { changeRequests: initialChangeRequests } },
  )
  const changeRequests = data?.changeRequests ?? []
  const hasPending = changeRequests.some((c) => c.status === 'pending')

  const today = new Date().toISOString().split('T')[0]
  const modifiable =
    (booking.status === 'pending' || booking.status === 'confirmed') && booking.checkIn > today

  const paymentMethodLabel = booking.paymentMethod
    ? paymentMethodLabels[booking.paymentMethod] ?? booking.paymentMethod
    : undefined

  const payMap: Record<string, string> = {
    unpaid: t('booking.payUnpaid'),
    pending: t('booking.payPending'),
    partial: t('booking.payPartial'),
    paid: t('booking.payPaid'),
    failed: t('booking.payFailed'),
    refunded: t('booking.payRefunded'),
  }

  const waUrl = `https://wa.me/${site.whatsapp.split('/').pop()}?text=${encodeURIComponent(
    `Hello, this is regarding my booking ${booking.ref} (${booking.roomName}, ${booking.checkIn} → ${booking.checkOut}).`,
  )}`
  const contactHref = `mailto:${site.email}?subject=${encodeURIComponent(`Booking ${booking.ref}`)}`

  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  async function cancelBooking() {
    if (!window.confirm(t('account.confirmCancel'))) return
    setCancelError('')
    setCanceling(true)
    const res = await fetch(`/api/bookings/${booking.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    const json = await res.json().catch(() => ({}))
    setCanceling(false)
    if (!res.ok) {
      setCancelError(json.error || 'Could not cancel booking.')
      return
    }
    window.location.reload()
  }

  async function withdraw(id: string) {
    await fetch('/api/account/change-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    })
    mutate()
  }

  return (
    <section className="container-luxe min-h-screen pb-24 pt-32">
      <Link
        href="/account?tab=bookings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t('account.bookings')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: booking summary */}
        <div className="glass-strong overflow-hidden rounded-3xl">
          {roomImage ? (
            <div className="relative h-48 w-full sm:h-60">
              <Image
                src={roomImage || '/placeholder.svg'}
                alt={t('booking.roomImageAlt')}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent" aria-hidden />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{booking.roomName}</h1>
                  <p className="font-mono text-sm text-primary">{booking.ref}</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', statusStyle[booking.status])}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 border-b border-border/50 p-6">
              <div>
                <h1 className="font-serif text-2xl text-foreground">{booking.roomName}</h1>
                <p className="font-mono text-sm text-primary">{booking.ref}</p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', statusStyle[booking.status])}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
          )}

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Detail icon={CalendarDays} label={t('booking.checkIn')} value={formatDate(booking.checkIn, locale)} />
            <Detail icon={CalendarDays} label={t('booking.checkOut')} value={formatDate(booking.checkOut, locale)} />
            <Detail icon={BedDouble} label={t('booking.room')} value={`${booking.roomName} × ${booking.rooms}`} />
            <Detail icon={Users} label={t('booking.guests')} value={`${booking.guests} · ${booking.nights} ${t('booking.nights')}`} />
            <Detail icon={UserCircle} label={t('booking.guestName')} value={booking.guestName} />
            <Detail icon={Mail} label={t('booking.guestEmail')} value={booking.guestEmail} />
            {booking.guestPhone ? <Detail icon={Phone} label={t('booking.guestPhone')} value={booking.guestPhone} /> : null}
            {paymentMethodLabel ? <Detail icon={CreditCard} label={t('booking.paymentMethod')} value={paymentMethodLabel} /> : null}
            <Detail icon={CalendarCheck} label={t('booking.bookedOn')} value={formatDateTime(booking.createdAt, locale)} />
          </div>

          {booking.specialRequests ? (
            <div className="border-t border-border/50 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="glass grid size-9 shrink-0 place-items-center rounded-xl text-primary">
                  <StickyNote className="size-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('booking.specialRequests')}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{booking.specialRequests}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t border-border/50 p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('booking.subtotal')}</span><span className="text-foreground">{money(booking.subtotal, booking.currency)}</span></div>
              {booking.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('booking.discount')}</span><span className="text-success">− {money(booking.discount, booking.currency)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">{t('booking.taxService')}</span><span className="text-foreground">{money(booking.tax, booking.currency)}</span></div>
              <div className="flex justify-between border-t border-border/50 pt-2"><span className="font-serif text-base text-foreground">{t('booking.total')}</span><span className="font-serif text-xl text-primary">{money(booking.total, booking.currency)}</span></div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t('booking.paymentStatus')}</span>
              <span className="font-medium text-foreground">{payMap[booking.paymentStatus]}</span>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border/50 p-6 sm:grid-cols-2 print:hidden">
            <a href={waUrl} target="_blank" rel="noreferrer" className={luxButton({ variant: 'success' })}>
              <MessageCircle className="size-4" /> {t('booking.sendWhatsApp')}
            </a>
            <LuxLink href={`/account/invoices/${booking.ref}`} variant="outline">
              <FileText className="size-4" /> {t('booking.viewInvoice')}
            </LuxLink>
            <a href={contactHref} className={luxButton({ variant: 'glass' })}>
              <Mail className="size-4" /> {t('booking.contactHotel')}
            </a>
            <LuxButton type="button" variant="glass" onClick={() => window.print()}>
              <Printer className="size-4" /> {t('booking.print')}
            </LuxButton>
            {modifiable && (
              <button
                onClick={cancelBooking}
                disabled={canceling}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-60 sm:col-span-2"
              >
                <XCircle className="size-4" />
                {canceling ? t('common.loading') : t('account.cancelBooking')}
              </button>
            )}
          </div>
          {cancelError && <p className="px-6 pb-4 text-xs text-destructive">{cancelError}</p>}
        </div>

        {/* Right: change requests */}
        <div className="flex flex-col gap-6 print:hidden">
          <ChangeRequestPanel
            booking={booking}
            roomOptions={roomOptions}
            modifiable={modifiable}
            hasPending={hasPending}
            requests={changeRequests}
            onChanged={mutate}
            onWithdraw={withdraw}
            today={today}
          />
        </div>
      </div>
    </section>
  )
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="glass grid size-9 shrink-0 place-items-center rounded-xl text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

const crIcon: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: XCircle,
}

function ChangeRequestPanel({
  booking,
  roomOptions,
  modifiable,
  hasPending,
  requests,
  onChanged,
  onWithdraw,
  today,
}: {
  booking: Booking
  roomOptions: RoomOption[]
  modifiable: boolean
  hasPending: boolean
  requests: BookingChangeRequest[]
  onChanged: () => void
  onWithdraw: (id: string) => void
  today: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ChangeRequestType>('dates')
  const [checkIn, setCheckIn] = useState(booking.checkIn)
  const [checkOut, setCheckOut] = useState(booking.checkOut)
  const [roomSlug, setRoomSlug] = useState(roomOptions[0]?.slug ?? '')
  const [guests, setGuests] = useState(booking.guests)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setError('')
    setSubmitting(true)
    const payload: Record<string, unknown> = { ref: booking.ref, type, message: message.trim() || undefined }
    if (type === 'dates') Object.assign(payload, { checkIn, checkOut })
    if (type === 'room') Object.assign(payload, { roomSlug })
    if (type === 'guests') Object.assign(payload, { guests })
    const res = await fetch('/api/account/change-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) {
      setError(json.error || 'Could not submit your request.')
      return
    }
    setOpen(false)
    setMessage('')
    onChanged()
  }

  const inputClass =
    'w-full rounded-xl border border-border/70 bg-transparent px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/60'

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
          <Pencil className="size-4 text-primary" /> {t('account.requestChange')}
        </h2>
        {modifiable && !hasPending && !open && (
          <LuxButton size="sm" onClick={() => setOpen(true)}>{t('account.newRequest')}</LuxButton>
        )}
      </div>

      {!modifiable && (
        <p className="mt-3 text-sm text-muted-foreground">{t('account.changeUnavailable')}</p>
      )}
      {modifiable && hasPending && !open && (
        <p className="mt-3 text-sm text-muted-foreground">{t('account.changePending')}</p>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('account.changeType')}</label>
            <select value={type} onChange={(e) => setType(e.target.value as ChangeRequestType)} className={inputClass}>
              <option value="dates">{crTypeLabel.dates}</option>
              {roomOptions.length > 0 && <option value="room">{crTypeLabel.room}</option>}
              <option value="guests">{crTypeLabel.guests}</option>
              <option value="other">{crTypeLabel.other}</option>
            </select>
          </div>

          {type === 'dates' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('booking.checkIn')}</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('booking.checkOut')}</label>
                <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {type === 'room' && (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('booking.room')}</label>
              <select value={roomSlug} onChange={(e) => setRoomSlug(e.target.value)} className={inputClass}>
                {roomOptions.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} — ${r.priceUSD}/night
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'guests' && (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('booking.guests')}</label>
              <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={inputClass} />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{t('account.changeMessage')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={t('account.changeMessagePlaceholder')}
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <LuxButton onClick={submit} disabled={submitting} className="flex-1">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('account.submitRequest')}
            </LuxButton>
            <LuxButton variant="glass" onClick={() => { setOpen(false); setError('') }}>
              {t('common.cancel') || 'Cancel'}
            </LuxButton>
          </div>
        </div>
      )}

      {/* Existing requests */}
      {requests.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-5">
          {requests.map((r) => {
            const Icon = crIcon[r.status] ?? Clock
            return (
              <div key={r.id} className="rounded-2xl border border-border/50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Icon className="size-4 text-primary" />
                    {crTypeLabel[r.type] ?? r.type}
                  </span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', crStatusStyle[r.status])}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {r.type === 'dates' && (
                    <span className="flex items-center gap-1.5">
                      {formatDate(r.fromCheckIn ?? '')} → {formatDate(r.fromCheckOut ?? '')}
                      <ArrowRight className="size-3 text-primary" />
                      {formatDate(r.checkIn ?? '')} → {formatDate(r.checkOut ?? '')}
                    </span>
                  )}
                  {r.type === 'room' && (
                    <span className="flex items-center gap-1.5">
                      {r.fromRoomName} <ArrowRight className="size-3 text-primary" /> {r.roomName}
                    </span>
                  )}
                  {r.type === 'guests' && (
                    <span className="flex items-center gap-1.5">
                      {r.fromGuests} <ArrowRight className="size-3 text-primary" /> {r.guests}
                    </span>
                  )}
                  {r.type === 'other' && r.message && <span>{r.message}</span>}
                </div>
                {r.adminNote && <p className="mt-1.5 text-xs text-muted-foreground">Note: {r.adminNote}</p>}
                {r.status === 'pending' && (
                  <button
                    onClick={() => onWithdraw(r.id)}
                    className="mt-2 text-xs font-medium text-destructive hover:underline"
                  >
                    {t('account.withdrawRequest')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
