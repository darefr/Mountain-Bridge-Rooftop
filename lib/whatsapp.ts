// Central WhatsApp handoff builder. Never sends automatically — callers wire
// this to an explicit "Send via WhatsApp" button. Uses NEXT_PUBLIC_HOTEL_WHATSAPP
// when configured, otherwise falls back to the number in lib/site.ts.

import { site } from '@/lib/site'

function normalizeNumber(raw: string) {
  return raw.replace(/[^0-9]/g, '')
}

export function whatsappNumber() {
  const env = process.env.NEXT_PUBLIC_HOTEL_WHATSAPP
  if (env && env.trim()) return normalizeNumber(env)
  // site.whatsapp is like https://wa.me/9779803607949
  const fromSite = site.whatsapp.split('/').pop() || ''
  return normalizeNumber(fromSite)
}

export function whatsappLink(message: string) {
  const num = whatsappNumber()
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

export type BookingWhatsappInput = {
  intro: string
  labels: {
    room: string
    dates: string
    guests: string
    total: string
    ref?: string
    name?: string
    phone?: string
    nights?: string
    payment?: string
  }
  roomName: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  total: string
  ref?: string
  guestName?: string
  guestPhone?: string
  nights?: number
  paymentStatus?: string
}

export function bookingWhatsappMessage(i: BookingWhatsappInput) {
  const lines = [i.intro, '']
  if (i.ref && i.labels.ref) lines.push(`${i.labels.ref}: ${i.ref}`)
  if (i.guestName && i.labels.name) lines.push(`${i.labels.name}: ${i.guestName}`)
  if (i.guestPhone && i.labels.phone) lines.push(`${i.labels.phone}: ${i.guestPhone}`)
  lines.push(`${i.labels.room}: ${i.roomName} × ${i.rooms}`)
  lines.push(`${i.labels.dates}: ${i.checkIn} → ${i.checkOut}`)
  if (i.nights != null && i.labels.nights) lines.push(`${i.labels.nights}: ${i.nights}`)
  lines.push(`${i.labels.guests}: ${i.guests}`)
  lines.push(`${i.labels.total}: ${i.total}`)
  if (i.paymentStatus && i.labels.payment) lines.push(`${i.labels.payment}: ${i.paymentStatus}`)
  return lines.join('\n')
}

export type ReservationWhatsappInput = {
  intro: string
  labels: { name: string; date: string; time: string; guests: string; phone: string; ref?: string; requests?: string }
  name: string
  date: string
  time: string
  guests: number
  phone: string
  requests?: string
  ref?: string
}

export function reservationWhatsappMessage(i: ReservationWhatsappInput) {
  const lines = [
    i.intro,
    '',
    `${i.labels.name}: ${i.name}`,
    `${i.labels.date}: ${i.date}`,
    `${i.labels.time}: ${i.time}`,
    `${i.labels.guests}: ${i.guests}`,
    `${i.labels.phone}: ${i.phone}`,
  ]
  if (i.requests && i.labels.requests) lines.push(`${i.labels.requests}: ${i.requests}`)
  if (i.ref && i.labels.ref) lines.push(`${i.labels.ref}: ${i.ref}`)
  return lines.join('\n')
}
