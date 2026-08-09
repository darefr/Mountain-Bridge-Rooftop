import { notFound, redirect } from 'next/navigation'
import { db, ensureLoaded } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { isStaffRole } from '@/lib/db/types'
import { InvoiceView } from '@/components/account/invoice-view'

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  await ensureLoaded()
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/account/invoices/${ref}`)

  const booking = db.bookings.find((b) => b.ref === ref)
  if (!booking) notFound()

  // Only the owner (by account id or matching verified email) or a staff member
  // may view the invoice. Using isStaffRole covers all back-office roles, and
  // email matching lets guests who booked before signing up see their invoice.
  const isOwner =
    booking.userId === user.id ||
    (!!user.email && booking.guestEmail?.toLowerCase() === user.email.toLowerCase())
  if (!isOwner && !isStaffRole(user.role)) redirect('/account')

  return <InvoiceView booking={booking} />
}
