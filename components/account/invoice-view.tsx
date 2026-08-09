'use client'

import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LuxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { money, formatDate } from '@/lib/format'
import { site } from '@/lib/site'
import type { Booking } from '@/lib/db/types'

export function InvoiceView({ booking }: { booking: Booking }) {
  const { t, locale } = useI18n()

  return (
    <section className="container-luxe min-h-screen pb-24 pt-32">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link href="/account" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" />
          {t('account.title')}
        </Link>
        <LuxButton variant="luxury" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          {t('account.downloadInvoice')}
        </LuxButton>
      </div>

      <div className="glass-strong mx-auto max-w-2xl rounded-3xl p-8 print:bg-white print:text-black">
        <div className="flex items-start justify-between border-b border-border/50 pb-6">
          <div>
            <p className="font-serif text-2xl text-foreground">{site.name}</p>
            <p className="text-sm text-muted-foreground">{site.location}</p>
            <p className="text-sm text-muted-foreground">{site.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('account.viewInvoice')}
            </p>
            <p className="font-mono text-lg text-primary">{booking.ref}</p>
            <p className="text-sm text-muted-foreground">{formatDate(booking.createdAt, locale)}</p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border/50 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('booking.guestDetails')}</p>
            <p className="mt-1 text-foreground">{booking.guestName}</p>
            <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
            {booking.guestPhone && <p className="text-sm text-muted-foreground">{booking.guestPhone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('account.status')}</p>
            <p className="mt-1 capitalize text-foreground">{booking.status}</p>
            <p className="text-sm capitalize text-muted-foreground">
              {t('payment.method')}: {booking.paymentMethod || '—'} · {booking.paymentStatus}
            </p>
          </div>
        </div>

        <div className="border-b border-border/50 py-6">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">
              {booking.roomName} × {booking.rooms} · {booking.nights} {t('common.nights')}
            </span>
            <span className="text-foreground">{money(booking.subtotal, booking.currency)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(booking.checkIn, locale)} → {formatDate(booking.checkOut, locale)} · {booking.guests} {t('common.guests')}
          </p>
        </div>

        <div className="flex flex-col gap-2 py-6 text-sm">
          <Row label={t('common.subtotal')} value={money(booking.subtotal, booking.currency)} />
          {booking.discount > 0 && (
            <Row
              label={`${t('common.discount')}${booking.couponCode ? ' (' + booking.couponCode + ')' : ''}`}
              value={`- ${money(booking.discount, booking.currency)}`}
            />
          )}
          <Row label={t('common.tax')} value={money(booking.tax, booking.currency)} />
          <div className="mt-2 flex justify-between border-t border-border/50 pt-3 text-base font-medium">
            <span className="text-foreground">{t('common.total')}</span>
            <span className="text-primary">{money(booking.total, booking.currency)}</span>
          </div>
        </div>

        <p className="pt-4 text-center text-xs text-muted-foreground">
          {t('footer.madeWith')} — {site.email}
        </p>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
