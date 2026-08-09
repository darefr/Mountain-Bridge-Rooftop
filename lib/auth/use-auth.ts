'use client'

import useSWR from 'swr'
import type { PublicUser } from '@/lib/db/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { res, json }
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<{ user: PublicUser | null }>(
    '/api/auth/me',
    fetcher,
    { revalidateOnFocus: false },
  )

  async function login(email: string, password: string, remember = true) {
    const { res, json } = await postJson('/api/auth/login', { email, password, remember })
    if (!res.ok) throw new Error(json.error || 'Login failed')
    await mutate()
    return json.user as PublicUser
  }

  async function signup(input: {
    name: string
    email: string
    password: string
    confirm?: string
    phone?: string
    country?: string
    acceptTerms?: boolean
    acceptPrivacy?: boolean
  }) {
    const { res, json } = await postJson('/api/auth/signup', input)
    if (!res.ok) throw new Error(json.error || 'Sign up failed')
    await mutate()
    return json as {
      user: PublicUser
      needsVerification?: boolean
      emailSent?: boolean
      emailError?: string
      missingEnv?: string[]
      devCode?: string
    }
  }

  async function verifyEmail(code: string) {
    const { res, json } = await postJson('/api/auth/verify-email', { code })
    if (!res.ok) {
      const err = new Error(json.error || 'Verification failed') as Error & { locked?: boolean }
      err.locked = json.locked
      throw err
    }
    await mutate()
    return json as { ok: true; user: PublicUser }
  }

  async function resendVerification() {
    const { res, json } = await postJson('/api/auth/resend-verification')
    if (!res.ok) {
      const err = new Error(json.error || 'Could not resend code') as Error & {
        devCode?: string
        missingEnv?: string[]
      }
      // Carry through non-sensitive diagnostics so the UI can still show a dev
      // code (non-prod) and name the missing env var, without hiding the error.
      err.devCode = json.devCode
      err.missingEnv = json.missingEnv
      throw err
    }
    return json as { ok: true; devCode?: string }
  }

  async function logout() {
    await postJson('/api/auth/logout')
    await mutate({ user: null }, { revalidate: false })
  }

  async function logoutAll() {
    await postJson('/api/auth/logout-all')
    await mutate({ user: null }, { revalidate: false })
  }

  return {
    user: data?.user ?? null,
    isLoading,
    error,
    login,
    signup,
    verifyEmail,
    resendVerification,
    logout,
    logoutAll,
    refresh: mutate,
  }
}
