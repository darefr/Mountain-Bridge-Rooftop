'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Users, BedDouble, Search } from 'lucide-react'
import { LuxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

export function BookingWidget({ className }: { className?: string }) {
  const today = new Date().toISOString().split('T')[0]
  const router = useRouter()
  const { t } = useI18n()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState(1)
  const [roomType, setRoomType] = useState('any')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!checkIn || !checkOut) {
      setError(t('booking.errDates'))
      return
    }
    if (checkOut <= checkIn) {
      setError(t('booking.errOrder'))
      return
    }
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests), rooms: String(rooms) })
    if (roomType !== 'any') params.set('room', roomType)
    router.push(`/book?${params.toString()}`)
  }

  const fieldBase =
    'peer w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

  return (
    <form
      onSubmit={submit}
      className={cn('glass-strong rounded-3xl p-4 sm:p-5', className)}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="size-3.5" /> {t('booking.checkIn')}
          </span>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={fieldBase}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="size-3.5" /> {t('booking.checkOut')}
          </span>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={fieldBase}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="size-3.5" /> {t('booking.guests')}
          </span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={fieldBase}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            <BedDouble className="size-3.5" /> {t('booking.roomType')}
          </span>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className={fieldBase}
          >
            <option value="any">{t('booking.anyRoom')}</option>
            <option value="valley">Valley View</option>
            <option value="deluxe">Bridge Deluxe</option>
            <option value="suite">Summit Suite</option>
          </select>
        </label>

        <div className="flex items-end">
          <LuxButton type="submit" variant="luxury" className="h-11 w-full">
            <Search className="size-4" />
            {t('booking.checkAvailability')}
          </LuxButton>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <button
            type="button"
            onClick={() => setRooms(Math.max(1, rooms - 1))}
            className="grid size-6 place-items-center rounded-full border border-border/70 hover:border-primary/60"
            aria-label="Fewer rooms"
          >
            −
          </button>
          <span className="min-w-16 text-center text-foreground">
            {rooms} {rooms === 1 ? t('booking.roomSingular') : t('booking.rooms')}
          </span>
          <button
            type="button"
            onClick={() => setRooms(Math.min(6, rooms + 1))}
            className="grid size-6 place-items-center rounded-full border border-border/70 hover:border-primary/60"
            aria-label="More rooms"
          >
            +
          </button>
        </div>
        <span className="text-muted-foreground">
          {t('booking.guarantee')}
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
