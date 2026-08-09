'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { LuxButton } from '@/components/ui/lux-button'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

const brand: Record<string, { name: string; color: string }> = {
  esewa: { name: 'eSewa', color: '#60bb46' },
  khalti: { name: 'Khalti', color: '#5c2d91' },
  fonepay: { name: 'Fonepay', color: '#d5202e' },
}

function GatewayInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()
  const [busy, setBusy] = useState<'success' | 'failed' | null>(null)

  const provider = params.get('provider') ?? 'esewa'
  const txn = params.get('txn') ?? ''
  const amount = params.get('amount') ?? '0'
  const ret = params.get('return') ?? '/'
  const b = brand[provider] ?? brand.esewa

  function finish(outcome: 'success' | 'failed') {
    setBusy(outcome)
    const url = new URL(ret, window.location.origin)
    url.searchParams.set('status', outcome)
    url.searchParams.set('txn', txn)
    setTimeout(() => router.replace(url.pathname + url.search), 900)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full rounded-3xl p-8 text-center"
      >
        <div
          className="mx-auto grid size-16 place-items-center rounded-2xl text-white"
          style={{ backgroundColor: b.color }}
        >
          <span className="font-serif text-2xl font-bold">{b.name[0]}</span>
        </div>
        <h1 className="mt-5 font-serif text-2xl text-foreground">{b.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('pay.sandboxNote')}</p>

        <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('pay.amount')}</span>
            <span className="font-semibold text-foreground">NPR {Number(amount).toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('pay.reference')}</span>
            <span className="font-mono text-foreground">{txn}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <LuxButton variant="luxury" onClick={() => finish('success')} disabled={!!busy}>
            {busy === 'success' ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {t('pay.paySuccess')}
          </LuxButton>
          <button
            onClick={() => finish('failed')}
            disabled={!!busy}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('pay.simulateFail')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function GatewayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>}>
      <GatewayInner />
    </Suspense>
  )
}
