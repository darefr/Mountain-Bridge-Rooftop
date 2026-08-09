import { NextResponse } from 'next/server'
import { getCurrentUser, destroyAllSessions } from '@/lib/auth/session'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  await destroyAllSessions(user.id)
  return NextResponse.json({ ok: true })
}
