'use client'

import { useState } from 'react'
import { Check, Send, Loader2 } from 'lucide-react'
import { LuxButton } from '@/components/ui/lux-button'

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const field =
    'w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') || '')
    const email = String(data.get('email') || '')
    const message = String(data.get('message') || '')
    if (!name || !email || !message) {
      setError('Please complete your name, email and message.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: String(data.get('phone') || ''),
          subject: String(data.get('subject') || ''),
          message,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-3xl p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-7" />
        </span>
        <h3 className="font-serif text-2xl text-foreground">Message sent</h3>
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          Thank you for reaching out. Our team will reply as soon as the
          mountain connection allows — usually within a day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass flex flex-col gap-4 rounded-3xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </span>
          <input name="name" className={field} placeholder="Your name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </span>
          <input name="email" type="email" className={field} placeholder="you@email.com" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phone <span className="normal-case opacity-60">(optional)</span>
        </span>
        <input name="phone" className={field} placeholder="+977 …" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Subject
        </span>
        <select name="subject" className={field} defaultValue="Booking enquiry">
          <option>Booking enquiry</option>
          <option>Restaurant reservation</option>
          <option>Trek & guide help</option>
          <option>Group / event</option>
          <option>Something else</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Message
        </span>
        <textarea
          name="message"
          rows={5}
          className={field}
          placeholder="How can we help with your Himalayan stay?"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <LuxButton type="submit" variant="luxury" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? 'Sending…' : 'Send message'}
      </LuxButton>
    </form>
  )
}
