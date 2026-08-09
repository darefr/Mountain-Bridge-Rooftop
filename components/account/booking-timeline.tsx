'use client'

import { Check } from 'lucide-react'
import type { Booking } from '@/lib/db/types'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'

// Maps a booking's status + payment state onto the fixed guest journey:
// Booked → Confirmed → Payment → Check-in → Stay → Check-out → Completed.
function currentStep(b: Booking): number {
  switch (b.status) {
    case 'completed':
      return 6
    case 'checked_out':
      return 5
    case 'checked_in':
      return 4
    case 'confirmed':
      // Payment cleared moves the marker to the "Payment" step (2), else "Confirmed" (1).
      return b.paymentStatus === 'paid' || b.paymentStatus === 'partial' ? 2 : 1
    case 'pending':
    default:
      return 0
  }
}

export function BookingTimeline({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  const steps = [
    t('account.stBooked'),
    t('account.stConfirmed'),
    t('account.stPayment'),
    t('account.stCheckIn'),
    t('account.stStay'),
    t('account.stCheckOut'),
    t('account.stCompleted'),
  ]
  const step = currentStep(booking)

  return (
    <div className="mt-4 border-t border-border/50 pt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t('account.timeline')}
      </p>
      <ol className="flex items-start justify-between gap-1">
        {steps.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    'h-0.5 flex-1',
                    i === 0 ? 'opacity-0' : done || active ? 'bg-primary' : 'bg-border/60',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border text-[0.6rem] transition-colors',
                    done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/60 bg-background/40 text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'h-0.5 flex-1',
                    i === steps.length - 1 ? 'opacity-0' : done ? 'bg-primary' : 'bg-border/60',
                  )}
                  aria-hidden
                />
              </div>
              <span
                className={cn(
                  'text-[0.6rem] leading-tight',
                  active ? 'font-medium text-primary' : done ? 'text-foreground/80' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
