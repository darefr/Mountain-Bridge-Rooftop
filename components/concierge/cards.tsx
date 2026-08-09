'use client'

import Image from 'next/image'
import {
  BedDouble,
  Users,
  Check,
  UtensilsCrossed,
  Clock,
  Tag,
  CalendarCheck,
  MessageCircle,
  ArrowRight,
} from 'lucide-react'
import type { TFunc } from '@/lib/i18n/translate'
import { whatsappLink } from '@/lib/whatsapp'
import { money } from '@/lib/format'
import { site } from '@/lib/site'

// A card is a structured tool result the concierge streamed back. Kinds map to
// concierge tools in lib/ai/tools.ts.
export type ConciergeCardData =
  | { kind: 'availability'; data: AvailabilityData }
  | { kind: 'rooms'; data: RoomsData }
  | { kind: 'offers'; data: OffersData }
  | { kind: 'menu'; data: MenuData }
  | { kind: 'bookingDraft'; data: BookingDraftData }
  | { kind: 'reservation'; data: ReservationData }
  | { kind: 'restaurantSlots'; data: SlotsData }

type RoomRow = {
  slug: string
  name: string
  image?: string
  priceUSD: number
  priceNPR?: number
  maxGuests: number
  available?: number
  soldOut?: boolean
  estimatedTotalUSD?: number
  amenities?: string[]
  blurb?: string
  bookUrl?: string
}
type AvailabilityData = {
  checkIn: string
  checkOut: string
  nights: number
  guests?: number | null
  rooms?: number
  results: RoomRow[]
}
type RoomsData = { rooms: RoomRow[] }
type OffersData = { offers: { title: string; tag?: string; image?: string; desc: string; includes: string[]; price: string }[] }
type MenuData = { categories: { title: string; items: { name: string; desc: string; price: string; tag?: string }[] }[] }
type BookingDraftData = {
  draft?: boolean
  error?: string
  soldOut?: boolean
  available?: number
  roomSlug?: string
  roomName?: string
  image?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  guests?: number | null
  rooms?: number
  nightlyUSD?: number
  estimatedTotalUSD?: number
  taxAndServicePct?: number
  bookUrl?: string
}
type ReservationData =
  | { ok: true; ref: string; date: string; time: string; guests: number; name: string; tableName: string; tableLocation?: string }
  | { ok: false; error: string; code: string; alternatives?: string[] }
type SlotsData = { date: string; guests: number; slots: string[]; anyAvailable: boolean }

const pill =
  'inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[0.68rem] text-muted-foreground'
const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95'
const wapBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-success/50 px-3.5 py-2 text-xs font-medium text-success transition-colors hover:bg-success/10'

export function ConciergeCard({ card, t }: { card: ConciergeCardData; t: TFunc }) {
  switch (card.kind) {
    case 'availability':
      return <AvailabilityCard data={card.data} t={t} />
    case 'rooms':
      return <RoomsCard data={card.data} t={t} />
    case 'offers':
      return <OffersCard data={card.data} t={t} />
    case 'menu':
      return <MenuCard data={card.data} />
    case 'bookingDraft':
      return <BookingDraftCard data={card.data} t={t} />
    case 'reservation':
      return <ReservationCard data={card.data} t={t} />
    case 'restaurantSlots':
      return <SlotsCard data={card.data} t={t} />
    default:
      return null
  }
}

function RoomImage({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-xl">
      <Image src={src || '/placeholder.svg'} alt={alt} fill sizes="320px" className="object-cover" />
    </div>
  )
}

function RoomMini({ room, t }: { room: RoomRow; t: TFunc }) {
  return (
    <div className="glass rounded-2xl p-2.5">
      <RoomImage src={room.image} alt={room.name} />
      <div className="mt-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{room.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            <Users className="size-3" /> {t('concierge.upTo')} {room.maxGuests}
            {typeof room.available === 'number' && !room.soldOut && (
              <span className="ml-1 text-success">· {room.available} {t('concierge.left')}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{money(room.priceUSD)}</p>
          <p className="text-[0.64rem] text-muted-foreground">/{t('concierge.night')}</p>
        </div>
      </div>
      {room.estimatedTotalUSD != null && (
        <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
          {t('concierge.estTotal')}: <span className="text-foreground">{money(room.estimatedTotalUSD)}</span>
        </p>
      )}
      {room.soldOut ? (
        <span className="mt-2 inline-block rounded-full bg-foreground/5 px-3 py-1.5 text-xs text-muted-foreground">
          {t('concierge.soldOut')}
        </span>
      ) : (
        <a href={room.bookUrl || `/book?room=${room.slug}`} className={`${primaryBtn} mt-2 w-full`}>
          <BedDouble className="size-3.5" /> {t('concierge.bookThisRoom')}
        </a>
      )}
    </div>
  )
}

function AvailabilityCard({ data, t }: { data: AvailabilityData; t: TFunc }) {
  const rooms = data.results ?? []
  const anyOpen = rooms.some((r) => !r.soldOut)
  return (
    <div className="w-full">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
        <CalendarCheck className="size-3.5 text-primary" />
        {data.checkIn} → {data.checkOut} · {data.nights} {t('concierge.nights')}
        {data.guests ? ` · ${data.guests} ${t('concierge.guests')}` : ''}
      </p>
      {!anyOpen && (
        <p className="mb-2 rounded-lg bg-foreground/5 px-3 py-2 text-xs text-muted-foreground">
          {t('concierge.noRooms')}
        </p>
      )}
      <div className="grid gap-2.5">
        {rooms.map((r) => (
          <RoomMini key={r.slug} room={r} t={t} />
        ))}
      </div>
    </div>
  )
}

function RoomsCard({ data, t }: { data: RoomsData; t: TFunc }) {
  return (
    <div className="grid gap-2.5">
      {(data.rooms ?? []).map((r) => (
        <RoomMini key={r.slug} room={r} t={t} />
      ))}
    </div>
  )
}

function BookingDraftCard({ data, t }: { data: BookingDraftData; t: TFunc }) {
  if (data.error) {
    return <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{data.error}</p>
  }
  const waMessage = [
    `${t('whatsapp.bookingIntro')}`,
    '',
    `${site.name}`,
    `${t('concierge.roomLabel')}: ${data.roomName} × ${data.rooms ?? 1}`,
    `${t('booking.checkIn')}: ${data.checkIn}`,
    `${t('booking.checkOut')}: ${data.checkOut}`,
    `${t('booking.guests')}: ${data.guests ?? '-'}`,
    `${t('concierge.estTotal')}: ${data.estimatedTotalUSD != null ? money(data.estimatedTotalUSD) : '-'}`,
  ].join('\n')

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex gap-3">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
          <Image src={data.image || '/placeholder.svg'} alt={data.roomName || 'Room'} fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{data.roomName}</p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            {data.checkIn} → {data.checkOut} · {data.nights} {t('concierge.nights')}
            {data.rooms ? ` · ${data.rooms} ${t('booking.rooms')}` : ''}
          </p>
          {data.estimatedTotalUSD != null && (
            <p className="mt-1 text-xs text-foreground">
              {t('concierge.estTotal')}: <span className="font-semibold">{money(data.estimatedTotalUSD)}</span>
              <span className="text-[0.66rem] text-muted-foreground"> ({t('concierge.inclTax')})</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={data.bookUrl || '/book'} className={primaryBtn}>
          <Check className="size-3.5" /> {t('concierge.confirmOnBooking')}
        </a>
        <a href={whatsappLink(waMessage)} target="_blank" rel="noreferrer" className={wapBtn}>
          <MessageCircle className="size-3.5" /> {t('concierge.sendWhatsApp')}
        </a>
      </div>
    </div>
  )
}

function ReservationCard({ data, t }: { data: ReservationData; t: TFunc }) {
  if (!data.ok) {
    return (
      <div className="glass rounded-2xl p-3">
        <p className="text-xs text-destructive">{data.error}</p>
        {data.alternatives && data.alternatives.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('concierge.tryTimes')}: <span className="text-foreground">{data.alternatives.join(', ')}</span>
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="glass rounded-2xl p-3.5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-success">
        <CalendarCheck className="size-4" /> {t('concierge.tableConfirmed')}
      </p>
      <div className="mt-2 space-y-1 text-xs text-foreground">
        <p><span className="text-muted-foreground">{t('concierge.ref')}:</span> {data.ref}</p>
        <p><span className="text-muted-foreground">{t('booking.guests')}:</span> {data.guests}</p>
        <p><span className="text-muted-foreground">{t('concierge.when')}:</span> {data.date} · {data.time}</p>
        <p><span className="text-muted-foreground">{t('concierge.table')}:</span> {data.tableName}{data.tableLocation ? ` (${data.tableLocation})` : ''}</p>
      </div>
    </div>
  )
}

function SlotsCard({ data, t }: { data: SlotsData; t: TFunc }) {
  return (
    <div className="glass rounded-2xl p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Clock className="size-3.5 text-primary" /> {data.date} · {data.guests} {t('concierge.guests')}
      </p>
      {data.anyAvailable ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.slots.map((s) => (
            <span key={s} className={pill}>{s}</span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{t('concierge.noSlots')}</p>
      )}
    </div>
  )
}

function OffersCard({ data, t }: { data: OffersData; t: TFunc }) {
  return (
    <div className="grid gap-2.5">
      {(data.offers ?? []).map((o) => (
        <div key={o.title} className="glass rounded-2xl p-2.5">
          <div className="flex gap-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image src={o.image || '/placeholder.svg'} alt={o.title} fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{o.title}</p>
                {o.tag && <span className={pill}><Tag className="size-2.5" /> {o.tag}</span>}
              </div>
              <p className="mt-0.5 text-[0.72rem] leading-snug text-muted-foreground line-clamp-2">{o.desc}</p>
              <p className="mt-1 text-xs font-semibold text-primary">{o.price}</p>
            </div>
          </div>
        </div>
      ))}
      <a href="/offers" className="inline-flex items-center gap-1 self-start text-xs text-primary hover:underline">
        {t('concierge.allOffers')} <ArrowRight className="size-3" />
      </a>
    </div>
  )
}

function MenuCard({ data }: { data: MenuData }) {
  return (
    <div className="glass rounded-2xl p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <UtensilsCrossed className="size-3.5 text-primary" /> Rooftop menu
      </p>
      <div className="mt-2 space-y-2.5">
        {(data.categories ?? []).map((c) => (
          <div key={c.title}>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{c.title}</p>
            <ul className="mt-1 space-y-0.5">
              {c.items.map((it) => (
                <li key={it.name} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-foreground">{it.name}</span>
                  <span className="shrink-0 text-muted-foreground">{it.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
