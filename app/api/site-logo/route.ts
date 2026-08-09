import { NextResponse } from 'next/server'
import { db, ADMIN_EMAIL, ensureLoaded } from '@/lib/db/store'

export const dynamic = 'force-dynamic'

// Public endpoint: exposes ONLY the primary admin's profile image so it can be
// used as the site-wide hotel logo. Falls back to null (the UI then keeps its
// built-in icon logo). Never returns any other user field.
export async function GET() {
  await ensureLoaded()
  const admin =
    db.users.find((u) => u.email === ADMIN_EMAIL) ??
    db.users.find((u) => u.role === 'admin' || u.role === 'super_admin')
  return NextResponse.json({ logo: admin?.image ?? null })
}
