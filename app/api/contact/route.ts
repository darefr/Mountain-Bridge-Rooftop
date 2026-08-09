import { NextResponse } from 'next/server'
import { db, persistDurable, uid, ensureLoaded } from '@/lib/db/store'
import { notifyStaff } from '@/lib/notify'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  await ensureLoaded()
  // Basic abuse protection — key on IP.
  const ip = clientIp(req)
  const rl = rateLimit(`contact:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many messages. Please try again shortly.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().slice(0, 200)
  const phone = body.phone ? String(body.phone).trim().slice(0, 60) : undefined
  const subject = body.subject ? String(body.subject).trim().slice(0, 160) : undefined
  const message = String(body.message || '').trim().slice(0, 4000)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Please complete your name, email and message.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  db.contactMessages.unshift({
    id: uid(),
    name,
    email,
    phone,
    subject,
    message,
    status: 'new',
    createdAt: Date.now(),
  })
  if (db.contactMessages.length > 1000) db.contactMessages = db.contactMessages.slice(0, 1000)
  await persistDurable()

  notifyStaff('New contact message', `${name}${subject ? ` — ${subject}` : ''}`, 'system')

  return NextResponse.json({ ok: true })
}
