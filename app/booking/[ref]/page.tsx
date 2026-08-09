import { db, ensureLoaded } from '@/lib/db/store'
import { getCurrentUser } from '@/lib/auth/session'
import { BookingConfirmation } from '@/components/booking/booking-confirmation'
import { BookingConfirmationFallback } from '@/components/booking/booking-confirmation-fallback'

export const dynamic = 'force-dynamic'

export default async function BookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  await ensureLoaded()
  let booking = db.bookings.find((b) => b.ref === ref)

  // A booking created on another serverless instance moments ago may not yet be
  // in this warm instance's snapshot. Force a fresh pull from durable storage
  // before giving up, so we serve the real record (read-your-write) rather than
  // a 404. When durable storage is unavailable this is a no-op and the client
  // fallback below renders the booking the API just returned.
  if (!booking) {
    await ensureLoaded(true)
    booking = db.bookings.find((b) => b.ref === ref)
  }

  if (!booking) {
    return (
      <section className="section-py container-luxe pt-32">
        <BookingConfirmationFallback bookingRef={ref} />
      </section>
    )
  }

  // The room image lives on the room category, not the booking itself.
  const roomImage = db.rooms.find((r) => r.slug === booking.roomSlug)?.image

  // Is the viewer the signed-in owner? Used to surface account-only actions
  // (e.g. "Manage booking") without blocking the guest confirmation screen.
  const user = await getCurrentUser().catch(() => null)
  const isOwner =
    !!user &&
    (booking.userId === user.id ||
      (!!user.email && booking.guestEmail?.toLowerCase() === user.email.toLowerCase()))

  return (
    <section className="section-py container-luxe pt-32">
      <BookingConfirmation booking={booking} roomImage={roomImage} isOwner={isOwner} />
    </section>
  )
}
