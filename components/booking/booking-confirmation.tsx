'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  Users,
  BedDouble,
  MessageCircle,
  FileText,
  Home,
  Mail,
  Phone,
  StickyNote,
  CreditCard,
  CalendarCheck,
  Settings2,
  UserCircle,
  Printer,
} from 'lucide-react'
import { LuxButton, LuxLink, luxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { money, formatDate, formatDateTime } from '@/lib/format'
import { site } from '@/lib/site'
import { whatsappLink, bookingWhatsappMessage } from '@/lib/whatsapp'
import type { Booking } from '@/lib/db/types'

const paymentMethodLabels: Record<string, string> = {
  pay_at_hotel: 'Pay at hotel',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'Fonepay',
}

export function BookingConfirmation({
  booking,
  roomImage,
  isOwner = false,
}: {
  booking: Booking
  roomImage?: string
  isOwner?: boolean
}) {
  const { t, locale } = useI18n()

  const statusStyles: Record<Booking['status'], { icon: typeof CheckCircle2; color: string; label: string }> = {
    confirmed: { icon: CheckCircle2, color: 'text-success', label: t('booking.statusConfirmed') },
    pending: { icon: Clock, color: 'text-amber-500', label: t('booking.statusPending') },
    cancelled: { icon: XCircle, color: 'text-destructive', label: t('booking.statusCancelled') },
    checked_in: { icon: CheckCircle2, color: 'text-primary', label: t('booking.statusCheckedIn') },
    checked_out: { icon: CheckCircle2, color: 'text-blue-500', label: t('booking.statusCheckedOut') },
    completed: { icon: CheckCircle2, color: 'text-success', label: t('booking.statusCompleted') },
    no_show: { icon: XCircle, color: 'text-destructive', label: t('booking.statusNoShow') },
  }
  const statusMap = statusStyles[booking.status] ?? statusStyles.confirmed
  const StatusIcon = statusMap.icon

  const payMap: Record<string, string> = {
    unpaid: t('booking.payUnpaid'),
    pending: t('booking.payPending'),
    partial: t('booking.payPartial'),
    paid: t('booking.payPaid'),
    failed: t('booking.payFailed'),
    refunded: t('booking.payRefunded'),
  }

  const paymentMethodLabel = booking.paymentMethod
    ? paymentMethodLabels[booking.paymentMethod] ?? booking.paymentMethod
    : undefined

  const waUrl = whatsappLink(
    bookingWhatsappMessage({
      intro: t('booking.waIntro'),
      labels: {
        room: t('booking.room'),
        dates: t('booking.dates'),
        guests: t('booking.guests'),
        total: t('booking.total'),
        ref: t('booking.reference'),
        name: t('booking.guestName'),
        phone: t('booking.guestPhone'),
        nights: t('booking.nights'),
        payment: t('booking.paymentStatus'),
      },
      roomName: booking.roomName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      rooms: booking.rooms,
      nights: booking.nights,
      total: money(booking.total, booking.currency),
      ref: booking.ref,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      paymentStatus: payMap[booking.paymentStatus],
    }),
  )

  const contactHref = `mailto:${site.email}?subject=${encodeURIComponent(`Booking ${booking.ref}`)}`

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong overflow-hidden rounded-3xl print:border print:shadow-none"
        id="booking-confirmation"
      >
        {roomImage ? (
          <div className="relative h-44 w-full sm:h-56">
            <Image
              src={roomImage || '/placeholder.svg'}
              alt={t('booking.roomImageAlt')}
              fill
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" aria-hidden />
          </div>
        ) : null}

        <div className="border-b border-border/50 p-8 text-center">
          <StatusIcon className={`mx-auto size-14 ${statusMap.color}`} />
          <h1 className="mt-4 font-serif text-3xl text-foreground">{statusMap.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('booking.confBody')}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t('booking.reference')}</span>
            <span className="font-mono text-sm font-semibold text-primary">{booking.ref}</span>
          </div>
        </div>

        <div className="grid gap-4 p-8 sm:grid-cols-2">
          <Detail icon={BedDouble} label={t('booking.room')} value={`${booking.roomName} × ${booking.rooms}`} />
          <Detail
            icon={Users}
            label={t('booking.guests')}
            value={`${booking.guests} · ${booking.nights} ${t('booking.nights')}`}
          />
          <Detail icon={CalendarDays} label={t('booking.checkIn')} value={formatDate(booking.checkIn, locale)} />
          <Detail icon={CalendarDays} label={t('booking.checkOut')} value={formatDate(booking.checkOut, locale)} />
          <Detail icon={UserCircle} label={t('booking.guestName')} value={booking.guestName} />
          <Detail icon={Mail} label={t('booking.guestEmail')} value={booking.guestEmail} />
          {booking.guestPhone ? (
            <Detail icon={Phone} label={t('booking.guestPhone')} value={booking.guestPhone} />
          ) : null}
          {paymentMethodLabel ? (
            <Detail icon={CreditCard} label={t('booking.paymentMethod')} value={paymentMethodLabel} />
          ) : null}
          <Detail icon={CalendarCheck} label={t('booking.bookedOn')} value={formatDateTime(booking.createdAt, locale)} />
        </div>

        {booking.specialRequests ? (
          <div className="border-t border-border/50 px-8 py-6">
            <div className="flex items-start gap-3">
              <div className="glass grid size-9 shrink-0 place-items-center rounded-xl text-primary">
                <StickyNote className="size-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('booking.specialRequests')}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{booking.specialRequests}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-t border-border/50 p-8">
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

        <div className="grid gap-3 border-t border-border/50 p-8 sm:grid-cols-2 print:hidden">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className={luxButton({ variant: 'success' })}
          >
            <MessageCircle className="size-4" />
            {t('booking.sendWhatsApp')}
          </a>
          {isOwner ? (
            <LuxLink href={`/account/bookings/${booking.ref}`} variant="luxury">
              <Settings2 className="size-4" />
              {t('booking.manageBooking')}
            </LuxLink>
          ) : (
            <LuxLink href="/account" variant="luxury">
              <UserCircle className="size-4" />
              {t('booking.myAccount')}
            </LuxLink>
          )}
          <LuxLink href={`/account/invoices/${booking.ref}`} variant="outline">
            <FileText className="size-4" />
            {t('booking.viewInvoice')}
          </LuxLink>
          <a href={contactHref} className={luxButton({ variant: 'glass' })}>
            <Mail className="size-4" />
            {t('booking.contactHotel')}
          </a>
          <LuxButton
            type="button"
            variant="glass"
            onClick={() => window.print()}
            className="sm:col-span-2"
          >
            <Printer className="size-4" />
            {t('booking.print')}
          </LuxButton>
        </div>
      </motion.div>

      <div className="mt-6 flex justify-center print:hidden">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Home className="size-4" /> {t('booking.backHome')}
        </Link>
      </div>
    </div>
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
