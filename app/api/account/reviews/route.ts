import { NextResponse } from 'next/server'
import { db, persist, uid } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { notify } from '@/lib/notify'
import type { ReviewRecord } from '@/lib/db/types'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  const reviews = db.reviews
    .filter((r) => r.userId === user.id || (user.email && r.email?.toLowerCase() === user.email))
    .sort((a, b) => b.createdAt - a.createdAt)
  return NextResponse.json({ reviews })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { text, rating, trip, country } = await req.json().catch(() => ({}))
  const cleanText = String(text || '').trim()
  const numRating = Math.min(5, Math.max(1, Number(rating) || 0))
  if (cleanText.length < 4 || !numRating) {
    return NextResponse.json({ error: 'Please add a rating and a short review.' }, { status: 400 })
  }

  const review: ReviewRecord = {
    id: uid(),
    userId: user.id,
    email: user.email,
    name: user.name,
    country: String(country || '').trim() || '—',
    text: cleanText.slice(0, 1000),
    rating: numRating,
    trip: String(trip || '').trim() || 'Stay',
    approved: false, // pending moderation
    createdAt: Date.now(),
  }
  db.reviews.unshift(review)
  persist()
  notify(user.id, 'Thanks for your review', 'Your review has been submitted for approval.', 'system')
  return NextResponse.json({ review })
}
