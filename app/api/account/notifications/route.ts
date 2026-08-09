import { NextResponse } from 'next/server'
import { db, persist } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { userNotifications } from '@/lib/notify'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  return NextResponse.json({ notifications: userNotifications(user.id) })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  const { id, all } = await req.json().catch(() => ({}))
  db.notifications.forEach((n) => {
    if (n.userId === user.id && (all || n.id === id)) n.read = true
  })
  persist()
  return NextResponse.json({ notifications: userNotifications(user.id) })
}
