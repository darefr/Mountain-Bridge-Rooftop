'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Loader2, MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { OtpInput } from '@/components/auth/otp-input'
import { LuxButton, LuxLink } from '@/components/ui/lux-button'
import { useAuth } from '@/lib/auth/use-auth'
import { useI18n } from '@/lib/i18n/context'

const RESEND_SECONDS = 60

export default function VerifyEmailPage() {
  const { t } = useI18n()
  const { user, isLoading, verifyEmail, resendVerification } = useAuth()
  const router = useRouter()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const submittedRef = useRef(false)

  // Pick up a dev code from signup (only present when no SMTP is configured).
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('mb_dev_code')
      if (stored) setDevCode(stored)
      // Honest delivery status from signup: warn if the email did not go out.
      const status = sessionStorage.getItem('mb_email_status')
      if (status) {
        const parsed = JSON.parse(status) as { sent?: boolean; error?: string }
        if (parsed.sent === false) {
          setEmailWarning(
            parsed.error ||
              'We could not send the verification email. Please use \u201CResend code\u201D.',
          )
        }
      }
    } catch {
      /* ignore */
    }
    setCooldown(RESEND_SECONDS)
  }, [])

  // Redirect signed-out users to login; skip already-verified accounts.
  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace('/login?next=/verify-email')
    else if (user.emailVerified && !done) router.replace('/account')
  }, [isLoading, user, done, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function submit(value: string) {
    if (submittedRef.current) return
    submittedRef.current = true
    setError('')
    setBusy(true)
    try {
      await verifyEmail(value)
      try {
        sessionStorage.removeItem('mb_dev_code')
        sessionStorage.removeItem('mb_email_status')
      } catch {
        /* ignore */
      }
      setDone(true)
      setTimeout(() => {
        router.push('/account')
        router.refresh()
      }, 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCode('')
    } finally {
      setBusy(false)
      submittedRef.current = false
    }
  }

  async function resend() {
    setError('')
    try {
      const res = await resendVerification()
      if (res.devCode) setDevCode(res.devCode)
      // A successful resend means a fresh email really went out — clear the
      // "email not sent" warning and reset the code entry.
      setEmailWarning(null)
      setCode('')
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      // Surface delivery failures honestly; still forward a dev code when one is
      // provided (non-production only).
      const e = err as Error & { devCode?: string }
      if (e.devCode) setDevCode(e.devCode)
      setError(e instanceof Error ? e.message : 'Could not resend code')
    }
  }

  if (isLoading || !user) {
    return (
      <AuthShell title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')}>
        <div className="flex justify-center py-6">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title={t('auth.verifyTitle')} subtitle="">
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
            <BadgeCheck className="size-7" />
          </span>
          <p className="text-sm text-foreground">{t('auth.verified')}</p>
          <LuxLink href="/account" variant="luxury" size="md">
            {t('account.title')}
          </LuxLink>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('auth.verifyTitle')} subtitle={t('auth.verifyCodeSubtitle')}>
      <div className="flex flex-col gap-5">
        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <MailCheck className="size-4 text-primary" />
          <span className="break-all">{user.email}</span>
        </p>

        {emailWarning && (
          <p
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-600 dark:text-amber-400"
            role="status"
          >
            {emailWarning}
          </p>
        )}

        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} invalid={!!error} />

        {error && (
          <p className="rounded-lg bg-destructive/15 px-3 py-2 text-center text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        {devCode && (
          <p className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-center text-xs text-muted-foreground">
            {t('auth.devCodeNote')}: <span className="font-mono text-primary">{devCode}</span>
          </p>
        )}

        <LuxButton
          type="button"
          variant="luxury"
          size="lg"
          className="w-full"
          disabled={busy || code.length < 6}
          onClick={() => submit(code)}
        >
          {busy ? t('common.loading') : t('auth.verifyButton')}
        </LuxButton>

        <div className="text-center text-sm text-muted-foreground">
          {t('auth.noCode')}{' '}
          {cooldown > 0 ? (
            <span>{t('auth.resendIn', { s: cooldown })}</span>
          ) : (
            <button type="button" onClick={resend} className="text-primary hover:underline">
              {t('auth.resendCode')}
            </button>
          )}
        </div>
      </div>
    </AuthShell>
  )
}
