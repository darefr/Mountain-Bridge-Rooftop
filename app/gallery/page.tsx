import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { GalleryGrid } from '@/components/gallery-grid'
import { CtaSection } from '@/components/cta-section'
import { getPublicGallery, getGalleryCategories } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'A visual journey through Hotel Mountain Bridge — rooms, rooftop dining, the lodge and the towering Annapurna peaks that surround Pisang.',
}

export default function GalleryPage() {
  const images = getPublicGallery().map((g) => ({ src: g.src, alt: g.title || g.alt, cat: g.category }))
  const categories = getGalleryCategories()
  return (
    <>
      <PageHero
        image="/images/gallery-exterior.png"
        alt="The lodge exterior at dusk"
        eyebrow="Gallery"
        title="A window on the mountains"
        description="Wander through our rooms, the rooftop restaurant and the breathtaking Himalayan landscape that makes Mountain Bridge unforgettable."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
        height="short"
      />

      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Explore"
          title="Moments from Mountain Bridge"
          description="Tap any image to view it full-screen. Filter by what you'd like to see."
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <GalleryGrid images={images} categories={categories} />
      </section>

      <CtaSection
        title="See it for yourself"
        description="Photos only tell half the story. Come experience the mountains, the food and the warmth in person."
        image="/images/hero-lodge-night.png"
      />
    </>
  )
}
