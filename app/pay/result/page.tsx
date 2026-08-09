'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { LuxLink } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'

function ResultInner() {
  const params = useSearchParams()
  const { t } = useI18n()
  const [state, setState] = useState<'checking' | 'paid' | 'failed' | 'pending'>('checking')
  const [bookingRef, setBookingRef] = useState<string | null>(null)

  const txn = params.get('txn') ?? ''
  const reported = params.get('status') ?? undefined

  useEffect(() => {
    let active = true
    async function verify() {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionUuid: txn, reportedStatus: reported }),
        })
        const data = await res.json()
        if (!active) return
        setBookingRef(data.bookingRef ?? null)
        setState(data.status === 'paid' ? 'paid' : data.status === 'pending' ? 'pending' : 'failed')
      } catch {
        if (active) setState('failed')
      }
    }
    if (txn) verify()
    else setState('failed')
    return () => {
      active = false
    }
  }, [txn, reported])

  const config = {
    checking: { icon: Loader2, spin: true, title: t('pay.verifying'), color: 'text-primary' },
    paid: { icon: CheckCircle2, spin: false, title: t('pay.success'), color: 'text-success' },
    failed: { icon: XCircle, spin: false, title: t('pay.failed'), color: 'text-destructive' },
    pending: { icon: Clock, spin: false, title: t('pay.pending'), color: 'text-amber-500' },
  }[state]
  const Icon = config.icon

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full rounded-3xl p-8 text-center"
      >
        <Icon className={`mx-auto size-16 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
        <h1 className="mt-5 font-serif text-2xl text-foreground">{config.title}</h1>

        {state === 'paid' && bookingRef && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('pay.successBody')} <span className="font-mono font-semibold text-foreground">{bookingRef}</span>
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <LuxLink href={`/booking/${bookingRef}`} variant="luxury">
                {t('pay.viewBooking')}
              </LuxLink>
              <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
                {t('common.myAccount')}
              </Link>
            </div>
          </>
        )}

        {state === 'pending' && (
          <p className="mt-2 text-sm text-muted-foreground">{t('pay.pendingBody')}</p>
        )}

        {state === 'failed' && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">{t('pay.failedBody')}</p>
            <div className="mt-6 flex flex-col gap-3">
              {bookingRef && (
                <LuxLink href={`/booking/${bookingRef}`} variant="luxury">
                  {t('pay.retryPayment')}
                </LuxLink>
              )}
              <Link href="/book" className="text-sm text-muted-foreground hover:text-foreground">
                {t('booking.newBooking')}
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function PayResultPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>}>
      <ResultInner />
    </Suspense>
  )
}
