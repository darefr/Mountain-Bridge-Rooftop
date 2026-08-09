import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { BookingFlow } from '@/components/booking/booking-flow'
import { getT } from '@/lib/i18n/server'

export const metadata = {
  title: 'Book Your Stay | Hotel Mountain Bridge',
  description:
    'Check real-time room availability, view transparent pricing, and reserve your Himalayan stay at Hotel Mountain Bridge, Pisang.',
}

export default async function BookPage() {
  const { t: d } = await getT()
  return (
    <>
      <PageHero
        image="/images/hero-lodge-night.png"
        alt="Hotel Mountain Bridge at night"
        eyebrow={d('booking.eyebrow')}
        title={d('booking.heroTitle')}
        description={d('booking.heroDesc')}
        crumbs={[{ label: d('nav.home'), href: '/' }, { label: d('booking.book') }]}
        height="short"
      />
      <section className="section-py container-luxe">
        <Suspense
          fallback={
            <div className="grid min-h-[40vh] place-items-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          }
        >
          <BookingFlow />
        </Suspense>
      </section>
    </>
  )
}
