'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { AuthShell, authField, authLabel } from '@/components/auth/auth-shell'
import { PasswordStrength } from '@/components/auth/password-strength'
import { LuxButton } from '@/components/ui/lux-button'
import { useAuth } from '@/lib/auth/use-auth'
import { validatePassword } from '@/lib/auth/password'
import { useI18n } from '@/lib/i18n/context'

export default function SignupPage() {
  const { t } = useI18n()
  const { signup } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    confirm: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError(t('auth.passwordsNoMatch'))
      return
    }
    const pwError = validatePassword(form.password)
    if (pwError) {
      setError(pwError)
      return
    }
    if (!acceptTerms) {
      setError(t('auth.mustAcceptTerms'))
      return
    }
    if (!acceptPrivacy) {
      setError(t('auth.mustAcceptPrivacy'))
      return
    }
    setBusy(true)
    try {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        confirm: form.confirm,
        phone: form.phone,
        country: form.country,
        acceptTerms,
        acceptPrivacy,
      })
      // Dev convenience only: stash the code so the verify page can show it when
      // no email provider is connected. Never used in production.
      if (result.devCode) {
        try {
          sessionStorage.setItem('mb_dev_code', result.devCode)
        } catch {
          /* ignore */
        }
      }
      // Carry the honest email-delivery status to the verify page so it can warn
      // the user if the verification email did not actually go out.
      try {
        if (result.emailSent === false) {
          sessionStorage.setItem(
            'mb_email_status',
            JSON.stringify({ sent: false, error: result.emailError }),
          )
        } else {
          sessionStorage.removeItem('mb_email_status')
        }
      } catch {
        /* ignore */
      }
      router.push('/verify-email')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className={authLabel}>
          {t('auth.name')}
          <input
            className={authField}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className={authLabel}>
          {t('auth.email')}
          <input
            type="email"
            className={authField}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={authLabel}>
            {t('auth.phone')}
            <input
              className={authField}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
              placeholder="+977 …"
            />
          </label>
          <label className={authLabel}>
            {t('auth.countryOptional')}
            <input
              className={authField}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              autoComplete="country-name"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={authLabel}>
            {t('auth.password')}
            <input
              type="password"
              className={authField}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label className={authLabel}>
            {t('auth.confirmPassword')}
            <input
              type="password"
              className={authField}
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        <PasswordStrength password={form.password} />

        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground/90">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-border/70 bg-background/40 accent-primary"
            />
            <span>
              {t('auth.acceptTerms')}{' '}
              <Link href="/faq" className="text-primary hover:underline">
                &#40;view&#41;
              </Link>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground/90">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-border/70 bg-background/40 accent-primary"
            />
            <span>
              {t('auth.acceptPrivacy')}{' '}
              <Link href="/faq" className="text-primary hover:underline">
                &#40;view&#41;
              </Link>
            </span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={busy}>
          <UserPlus className="size-4" />
          {busy ? t('common.loading') : t('auth.createAccount')}
        </LuxButton>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('common.signIn')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
