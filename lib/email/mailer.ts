import 'server-only'
import nodemailer from 'nodemailer'
import { money, formatDate } from '@/lib/format'
import { site } from '@/lib/site'
import type { Booking, Reservation } from '@/lib/db/types'

// ---------------------------------------------------------------------------
// Email delivery for Hotel Mountain Bridge.
// Uses SMTP (Nodemailer) when configured via environment variables. When no
// SMTP is configured we do NOT fail — we log server-side only so local/preview
// flows keep working. Raw codes are never returned to the client from here.
//
// Required env vars for real delivery:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   EMAIL_FROM   (e.g. "Hotel Mountain Bridge <no-reply@mountainbridgepisang.com>")
// ---------------------------------------------------------------------------

// Accept either EMAIL_FROM or SMTP_FROM (the latter is what this deployment
// provisions). Falls back to the SMTP user, then a sane default.
const FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  'Hotel Mountain Bridge <no-reply@mountainbridgepisang.com>'

// The env vars required for real SMTP delivery. SMTP_PORT and SMTP_FROM are
// optional (they have safe fallbacks), so they are not part of this list.
const REQUIRED_EMAIL_ENV = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const

// Names of any required SMTP env vars that are not set. Returns variable NAMES
// only — never values — so it is safe to surface for diagnostics.
export function missingEmailEnv(): string[] {
  return REQUIRED_EMAIL_ENV.filter((k) => !process.env[k])
}

export function isEmailConfigured(): boolean {
  return missingEmailEnv().length === 0
}

type GlobalMailer = { __mb_transport?: nodemailer.Transporter }
const g = globalThis as unknown as GlobalMailer

function transport() {
  if (g.__mb_transport) return g.__mb_transport
  // Gmail: host smtp.gmail.com, port 465 (SSL) → secure true, or 587 (STARTTLS)
  // → secure false. `secure` is derived from the port so either works.
  const port = Number(process.env.SMTP_PORT || 465)
  g.__mb_transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Bound the SMTP handshake so a hung connection can never exceed the
    // serverless function timeout on Vercel.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return g.__mb_transport
}

export type SendResult = {
  delivered: boolean
  // Why delivery did not happen, for server-side diagnostics and to let callers
  // decide how to respond. Never contains credentials or one-time codes.
  reason?: 'unconfigured' | 'send_failed'
  // Names (not values) of missing env vars when reason is 'unconfigured'.
  missing?: string[]
  // A safe, user-presentable message. Never includes the code or credentials.
  error?: string
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  const missing = missingEmailEnv()
  if (missing.length > 0) {
    // No provider connected — log the MISSING VARIABLE NAMES only (never values).
    // The subject is intentionally omitted because verification/reset subjects
    // embed the raw one-time code, which must never appear in logs.
    console.log(`[v0] Email not sent — missing SMTP env: ${missing.join(', ')}`)
    return {
      delivered: false,
      reason: 'unconfigured',
      missing,
      error: 'Email service is not configured yet.',
    }
  }
  try {
    await transport().sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    })
    return { delivered: true }
  } catch (err) {
    // Log only the safe error message — never credentials or the code.
    console.log('[v0] Email send failed:', err instanceof Error ? err.message : 'unknown error')
    return {
      delivered: false,
      reason: 'send_failed',
      error: 'Unable to send the email right now. Please try again.',
    }
  }
}

// --- Branded templates -----------------------------------------------------

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0f1115;font-family:Georgia,'Times New Roman',serif;color:#e9e6df">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:20px;letter-spacing:1px;color:#e9c46a">Hotel Mountain Bridge</div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a8578">Pisang · Manang · Annapurna</div>
    </div>
    <div style="background:#171a20;border:1px solid #262a33;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:400;color:#f4f1ea">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;font-size:11px;color:#6b675d;margin-top:20px">
      Hotel Mountain Bridge &amp; Rooftop Restaurant · Pisang, Manang, Nepal
    </p>
  </div></body></html>`
}

function codeBlock(code: string) {
  return `<div style="margin:20px 0;text-align:center">
    <div style="display:inline-block;background:#0f1115;border:1px solid #3a3f4b;border-radius:12px;padding:16px 24px;font-family:'Courier New',monospace;font-size:32px;letter-spacing:10px;color:#e9c46a">${code}</div>
  </div>`
}

export async function sendVerificationCode(to: string, name: string, code: string) {
  const title = 'Email Verification'
  const body = `
    <p style="color:#c9c5bb;line-height:1.6">Hi ${escapeHtml(name)}, welcome to <strong style="color:#f4f1ea">Hotel Mountain Bridge &amp; Rooftop Restaurant</strong>. You're creating an account with us — use the verification code below to confirm your email address and activate your account.</p>
    ${codeBlock(code)}
    <p style="color:#8a8578;font-size:13px;line-height:1.6">This code expires in <strong>10 minutes</strong> and can be used once.</p>
    <p style="color:#8a8578;font-size:13px;line-height:1.6">If you did not create this account, you can safely ignore this email — no account will be activated.</p>`
  const text = [
    'Hotel Mountain Bridge & Rooftop Restaurant',
    'Email Verification',
    '',
    `Hi ${name}, welcome! You're creating an account with us.`,
    `Your verification code is: ${code}`,
    'This code expires in 10 minutes and can be used once.',
    '',
    'If you did not create this account, you can safely ignore this email.',
  ].join('\n')
  return sendMail({
    to,
    subject: `Your Hotel Mountain Bridge verification code is ${code}`,
    html: shell(title, body),
    text,
  })
}

export async function sendPasswordResetCode(to: string, name: string, code: string) {
  const title = 'Reset your password'
  const body = `
    <p style="color:#c9c5bb;line-height:1.6">Hi ${escapeHtml(name)}, we received a request to reset your password. Enter the code below to continue.</p>
    ${codeBlock(code)}
    <p style="color:#8a8578;font-size:13px;line-height:1.6">This code expires in 10 minutes and can be used once. If you didn't request this, no action is needed — your password stays the same.</p>`
  const text = `Your Mountain Bridge password reset code is ${code}. It expires in 10 minutes.`
  return sendMail({ to, subject: `Your Mountain Bridge password reset code is ${code}`, html: shell(title, body), text })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

// --- Booking & reservation transactional emails ----------------------------

function detailRows(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;color:#8a8578;font-size:13px">${escapeHtml(k)}</td><td style="padding:7px 0;text-align:right;color:#f4f1ea;font-size:13px;font-weight:600">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>`
}

function refBadge(label: string, ref: string) {
  return `<div style="margin:18px 0;text-align:center">
    <span style="display:inline-block;background:#0f1115;border:1px solid #3a3f4b;border-radius:10px;padding:10px 18px;font-family:'Courier New',monospace;font-size:18px;letter-spacing:3px;color:#e9c46a">${escapeHtml(label)}: ${escapeHtml(ref)}</span>
  </div>`
}

function contactFooter() {
  return `<p style="color:#8a8578;font-size:13px;line-height:1.7;margin-top:18px">
    Questions? Call <a href="${site.phoneHref}" style="color:#e9c46a;text-decoration:none">${site.phone}</a>,
    email <a href="mailto:${site.email}" style="color:#e9c46a;text-decoration:none">${site.email}</a>,
    or message us on <a href="${site.whatsapp}" style="color:#3fbf7f;text-decoration:none">WhatsApp</a>.
  </p>`
}

export type BookingEmailKind =
  | 'created'
  | 'confirmed'
  | 'payment_received'
  | 'payment_failed'
  | 'cancelled'

const bookingCopy: Record<BookingEmailKind, { title: string; intro: string }> = {
  created: {
    title: 'Booking received',
    intro: 'Thank you for choosing Hotel Mountain Bridge. Your booking has been received and is awaiting payment confirmation.',
  },
  confirmed: {
    title: 'Booking confirmed',
    intro: 'Wonderful news — your booking is confirmed. We look forward to welcoming you to the Himalayas.',
  },
  payment_received: {
    title: 'Payment received',
    intro: 'We have received your payment and your stay is fully confirmed. Namaste and see you soon!',
  },
  payment_failed: {
    title: 'Payment unsuccessful',
    intro: 'Unfortunately your payment could not be completed. Your room is held briefly — you can retry payment or pay at the hotel.',
  },
  cancelled: {
    title: 'Booking cancelled',
    intro: 'Your booking has been cancelled as requested. We hope to host you another time.',
  },
}

const paymentStatusLabel: Record<string, string> = {
  unpaid: 'Pay at hotel',
  pending: 'Pending',
  partial: 'Partially paid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

export async function sendBookingEmail(booking: Booking, kind: BookingEmailKind) {
  const copy = bookingCopy[kind]
  const rows: [string, string][] = [
    ['Room', `${booking.roomName} × ${booking.rooms}`],
    ['Check-in', formatDate(booking.checkIn)],
    ['Check-out', formatDate(booking.checkOut)],
    ['Nights', String(booking.nights)],
    ['Guests', String(booking.guests)],
    ['Total', money(booking.total, booking.currency)],
    ['Payment', paymentStatusLabel[booking.paymentStatus] ?? booking.paymentStatus],
  ]
  const body = `
    <p style="color:#c9c5bb;line-height:1.6">Dear ${escapeHtml(booking.guestName)},</p>
    <p style="color:#c9c5bb;line-height:1.6">${copy.intro}</p>
    ${refBadge('Booking', booking.ref)}
    ${detailRows(rows)}
    ${contactFooter()}`
  const subject = `${copy.title} · ${booking.ref} · Hotel Mountain Bridge`
  const text = `${copy.title}\n${copy.intro}\nBooking: ${booking.ref}\nRoom: ${booking.roomName} x${booking.rooms}\n${booking.checkIn} -> ${booking.checkOut} (${booking.nights} nights)\nGuests: ${booking.guests}\nTotal: ${money(booking.total, booking.currency)}\nPayment: ${paymentStatusLabel[booking.paymentStatus] ?? booking.paymentStatus}`
  return sendMail({ to: booking.guestEmail, subject, html: shell(copy.title, body), text })
}

export async function sendReservationEmail(
  reservation: Reservation,
  kind: 'confirmed' | 'cancelled' = 'confirmed',
  tableName?: string,
) {
  if (!reservation.email) return { delivered: false }
  const confirmed = kind === 'confirmed'
  const title = confirmed ? 'Table reservation confirmed' : 'Reservation cancelled'
  const intro = confirmed
    ? 'Your table at our rooftop restaurant is reserved. We can\u2019t wait to serve you with a view of the Annapurnas.'
    : 'Your restaurant reservation has been cancelled. We hope to welcome you another evening.'
  const rows: [string, string][] = [
    ['Date', formatDate(reservation.date)],
    ['Time', reservation.time],
    ['Guests', String(reservation.guests)],
  ]
  if (tableName) rows.push(['Table', tableName])
  if (reservation.requests) rows.push(['Requests', reservation.requests])
  const body = `
    <p style="color:#c9c5bb;line-height:1.6">Dear ${escapeHtml(reservation.name)},</p>
    <p style="color:#c9c5bb;line-height:1.6">${intro}</p>
    ${refBadge('Reservation', reservation.ref)}
    ${detailRows(rows)}
    ${contactFooter()}`
  const subject = `${title} · ${reservation.ref} · Rooftop Restaurant`
  const text = `${title}\n${intro}\nReservation: ${reservation.ref}\n${reservation.date} at ${reservation.time}\nGuests: ${reservation.guests}${tableName ? `\nTable: ${tableName}` : ''}`
  return sendMail({ to: reservation.email, subject, html: shell(title, body), text })
}
