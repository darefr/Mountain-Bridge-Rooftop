'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft } from 'lucide-react'
import { AuthShell, authField, authLabel } from '@/components/auth/auth-shell'
import { LuxButton } from '@/components/ui/lux-button'
import { useI18n } from '@/lib/i18n/context'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json().catch(() => ({}))
    // Dev convenience only (no SMTP configured).
    if (json.devCode) {
      try {
        sessionStorage.setItem('mb_dev_reset_code', json.devCode)
      } catch {
        /* ignore */
      }
    }
    setBusy(false)
    // Always advance to the code step — we never reveal whether the email exists.
    router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)
  }

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotCodeSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className={authLabel}>
          {t('auth.email')}
          <input
            type="email"
            className={authField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={busy}>
          <Mail className="size-4" />
          {busy ? t('common.loading') : t('auth.sendResetCode')}
        </LuxButton>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          {t('auth.backToSignIn')}
        </Link>
      </form>
    </AuthShell>
  )
}
