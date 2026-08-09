import { notFound, redirect } from 'next/navigation'
import { db, ensureLoaded } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { isStaffRole } from '@/lib/db/types'
import { BookingDetail } from '@/components/account/booking-detail'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manage booking',
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  await ensureLoaded()

  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/account/bookings/${ref}`)

  const booking = db.bookings.find((b) => b.ref === ref)
  if (!booking) notFound()

  // Strict ownership: only the owning customer (by account id or matching
  // verified email) or a staff member may view/manage this booking. This blocks
  // an IDOR where another signed-in customer guesses a reference.
  const isOwner =
    booking.userId === user.id ||
    (!!user.email && booking.guestEmail?.toLowerCase() === user.email.toLowerCase())
  if (!isOwner && !isStaffRole(user.role)) redirect('/account')

  const roomImage = db.rooms.find((r) => r.slug === booking.roomSlug)?.image

  // Alternative active rooms that fit this booking's guest count — offered as
  // options in the "change room" request form.
  const roomOptions = db.rooms
    .filter((r) => r.active !== false && r.slug !== booking.roomSlug && r.maxGuests * booking.rooms >= booking.guests)
    .map((r) => ({ slug: r.slug, name: r.name, priceUSD: r.priceUSD, maxGuests: r.maxGuests }))

  // This booking's change requests (owner-scoped in the API too).
  const changeRequests = db.changeRequests
    .filter((c) => c.bookingId === booking.id)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <BookingDetail
      booking={booking}
      roomImage={roomImage}
      roomOptions={roomOptions}
      initialChangeRequests={changeRequests}
    />
  )
}
