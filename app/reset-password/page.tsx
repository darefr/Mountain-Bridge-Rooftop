'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { AuthShell, authField, authLabel } from '@/components/auth/auth-shell'
import { OtpInput } from '@/components/auth/otp-input'
import { PasswordStrength } from '@/components/auth/password-strength'
import { LuxButton } from '@/components/ui/lux-button'
import { validatePassword } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/context'

function ResetInner() {
  const { t } = useI18n()
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('mb_dev_reset_code')
      if (stored) setDevCode(stored)
    } catch {
      /* ignore */
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (code.length < 6) {
      setError(t('auth.enterCode'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordsNoMatch'))
      return
    }
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    setBusy(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(json.error || 'Reset failed')
      return
    }
    try {
      sessionStorage.removeItem('mb_dev_reset_code')
    } catch {
      /* ignore */
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 1800)
  }

  if (done) {
    return (
      <AuthShell title={t('auth.resetTitle')} subtitle="">
        <p className="rounded-lg bg-success/15 px-3 py-3 text-center text-sm text-success">
          {t('auth.passwordUpdated')}
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetCodeSubtitle')}>
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

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('auth.verificationCode')}
          </span>
          <OtpInput value={code} onChange={setCode} invalid={!!error} autoFocus={false} />
        </div>

        {devCode && (
          <p className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-center text-xs text-muted-foreground">
            {t('auth.devCodeNote')}: <span className="font-mono text-primary">{devCode}</span>
          </p>
        )}

        <label className={authLabel}>
          {t('auth.newPassword')}
          <input
            type="password"
            className={authField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <PasswordStrength password={password} />
        <label className={authLabel}>
          {t('auth.confirmPassword')}
          <input
            type="password"
            className={authField}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {error && (
          <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={busy}>
          <KeyRound className="size-4" />
          {busy ? t('common.loading') : t('auth.updatePassword')}
        </LuxButton>
        <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">
          {t('auth.backToSignIn')}
        </Link>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  )
}
