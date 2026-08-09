'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { AuthShell, authField, authLabel } from '@/components/auth/auth-shell'
import { LuxButton } from '@/components/ui/lux-button'
import { useAuth } from '@/lib/auth/use-auth'
import { isStaffRole } from '@/lib/db/types'
import { useI18n } from '@/lib/i18n/context'

export default function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/account'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(email, password, remember)
      // Role-based routing: staff/admin roles go to the back office, customers
      // to their account. Unverified customers are sent to verify first.
      if (isStaffRole(user.role)) {
        router.push('/admin')
      } else if (!user.emailVerified) {
        router.push('/verify-email')
      } else {
        router.push(next)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className={authLabel}>
          {t('auth.email')}
          <input
            type="email"
            autoComplete="email"
            className={authField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={authLabel}>
          {t('auth.password')}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${authField} pr-11`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-border/70 bg-background/40 text-primary accent-primary"
            />
            {t('auth.rememberMe')}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={busy}>
          <LogIn className="size-4" />
          {busy ? t('common.loading') : t('common.signIn')}
        </LuxButton>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link href="/signup" className="text-primary hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
