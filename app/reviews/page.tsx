import type { Metadata } from 'next'
import { Star, Award, Globe, ThumbsUp } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { Testimonials } from '@/components/testimonials'
import { CtaSection } from '@/components/cta-section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Reviews',
  description:
    'A perfect 5.0 rating from trekkers around the world. Read what guests say about Hotel Mountain Bridge in Pisang.',
}

const ratingBars = [
  { label: 'Cleanliness', value: 5.0 },
  { label: 'Hospitality', value: 5.0 },
  { label: 'Food', value: 4.9 },
  { label: 'Location', value: 5.0 },
  { label: 'Value', value: 4.9 },
]

const highlights = [
  { icon: Award, value: '5.0', label: 'Overall rating' },
  { icon: ThumbsUp, value: '100%', label: 'Would return' },
  { icon: Globe, value: '20+', label: 'Countries welcomed' },
  { icon: Star, value: `${site.reviewsCount}`, label: 'Verified reviews' },
]

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        image="/images/rooftop-dining.png"
        alt="Guests dining on the rooftop"
        eyebrow="Guest reviews"
        title="Loved at the roof of the world"
        description="Trekkers from every continent rate Hotel Mountain Bridge a perfect five stars. Here's why."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
        height="short"
      />

      {/* Highlights */}
      <section className="border-b border-border/50 bg-card/30">
        <div className="container-luxe grid grid-cols-2 gap-8 py-14 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.08} className="flex flex-col items-center gap-2 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
                <h.icon className="size-5" />
              </span>
              <span className="font-serif text-4xl font-light text-gradient-gold">
                {h.value}
              </span>
              <span className="text-sm text-muted-foreground">{h.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Rating breakdown */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <SectionHeading
            eyebrow="The scores"
            title="Consistently exceptional"
            description="Our guests rate us across every part of the experience — and the numbers speak for themselves."
          />
          <div className="flex flex-col gap-5">
            {ratingBars.map((r, i) => (
              <Reveal key={r.label} delay={i * 0.06}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{r.label}</span>
                    <span className="flex items-center gap-1 text-primary">
                      <Star className="size-4 fill-primary" />
                      {r.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[oklch(0.74_0.1_78)] to-[oklch(0.86_0.11_86)]"
                      style={{ width: `${(r.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* All reviews */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="In their words"
            title="Stories from our guests"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Testimonials limit={6} />
        </div>
      </section>

      {/* Leave a review */}
      <section className="container-luxe py-20 sm:py-28">
        <Reveal>
          <div className="glass flex flex-col items-center gap-5 rounded-3xl p-10 text-center">
            <div className="flex gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-6 fill-primary" />
              ))}
            </div>
            <h3 className="font-serif text-2xl text-foreground sm:text-3xl">
              Stayed with us? We'd love to hear from you
            </h3>
            <p className="max-w-lg text-pretty leading-relaxed text-muted-foreground">
              Your words help fellow travellers find their way to a warm bed and
              a hot meal in the mountains. Share your experience on Google or
              Facebook.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="shine group inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-b from-[oklch(0.86_0.11_86)] to-[oklch(0.74_0.1_78)] px-6 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Review on Google
              </a>
              <a
                href={site.facebook}
                target="_blank"
                rel="noreferrer"
                className="glass inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm text-foreground transition-colors hover:text-primary"
              >
                Review on Facebook
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <CtaSection
        title="Earn your own five-star memory"
        description="Book your stay and discover why travellers return to Mountain Bridge year after year."
        image="/images/hero-lodge-night.png"
      />
    </>
  )
}
