import { NextResponse } from 'next/server'
import { persist, uid } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import type { WishlistItem, WishlistKind } from '@/lib/db/types'

const KINDS: WishlistKind[] = ['room', 'offer', 'experience']
const MAX_ITEMS = 100

function cap(v: unknown, n = 200) {
  return typeof v === 'string' ? v.trim().slice(0, n) : ''
}

// GET — the current user's wishlist (newest first).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  const wishlist = [...(user.wishlist ?? [])].sort((a, b) => b.addedAt - a.addedAt)
  return NextResponse.json({ wishlist })
}

// POST — add an item. Idempotent per (kind, refId): re-adding is a no-op.
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const kind = body?.kind as WishlistKind
  const refId = cap(body?.refId, 120)
  const title = cap(body?.title, 200)

  if (!KINDS.includes(kind) || !refId || !title) {
    return NextResponse.json({ error: 'Invalid wishlist item.' }, { status: 400 })
  }

  user.wishlist = user.wishlist ?? []
  const exists = user.wishlist.find((w) => w.kind === kind && w.refId === refId)
  if (!exists) {
    if (user.wishlist.length >= MAX_ITEMS) {
      return NextResponse.json({ error: 'Your wishlist is full.' }, { status: 400 })
    }
    const item: WishlistItem = {
      id: uid(),
      kind,
      refId,
      title,
      image: cap(body?.image, 300) || undefined,
      href: cap(body?.href, 300) || undefined,
      meta: cap(body?.meta, 120) || undefined,
      addedAt: Date.now(),
    }
    user.wishlist.push(item)
    persist()
  }

  return NextResponse.json({ wishlist: user.wishlist })
}

// DELETE — remove by ?id= or by ?kind=&refId=.
export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const kind = searchParams.get('kind')
  const refId = searchParams.get('refId')

  const before = (user.wishlist ?? []).length
  user.wishlist = (user.wishlist ?? []).filter((w) =>
    id ? w.id !== id : !(w.kind === kind && w.refId === refId),
  )
  if (user.wishlist.length !== before) persist()

  return NextResponse.json({ wishlist: user.wishlist })
}
