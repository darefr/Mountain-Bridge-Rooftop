import { NextResponse } from 'next/server'
import { getCurrentUser, toPublic } from '@/lib/auth/session'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ user: user ? toPublic(user) : null })
}
