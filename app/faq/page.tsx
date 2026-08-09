import type { Metadata } from 'next'
import { BedDouble, UtensilsCrossed, Mountain, HelpCircle } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { FaqAccordion } from '@/components/faq-accordion'
import { CtaSection } from '@/components/cta-section'
import { Reveal } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'
import { site } from '@/lib/site'
import { getPublicFaqGroups } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers to common questions about staying at Hotel Mountain Bridge in Pisang — getting there, altitude, meals, booking and more.',
}

// Pick an icon for a category by keyword, defaulting to a generic help icon.
function iconFor(category: string) {
  const c = category.toLowerCase()
  if (c.includes('dining') || c.includes('meal') || c.includes('food') || c.includes('amenit')) return UtensilsCrossed
  if (c.includes('stay') || c.includes('book') || c.includes('room')) return BedDouble
  if (c.includes('here') || c.includes('altitude') || c.includes('trek') || c.includes('getting')) return Mountain
  return HelpCircle
}

export default function FaqPage() {
  const groups = getPublicFaqGroups().map((g) => ({
    icon: iconFor(g.category),
    title: g.category,
    items: g.items.map((f) => ({ q: f.question, a: f.answer })),
  }))
  return (
    <>
      <PageHero
        image="/images/lounge.png"
        alt="The cosy lounge"
        eyebrow="Good to know"
        title="Frequently asked questions"
        description="Everything you need to plan a smooth, comfortable stay on the Annapurna Circuit. Can't find your answer? Just ask."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]}
        height="short"
      />

      <section className="container-luxe py-20 sm:py-28">
        <div className="flex flex-col gap-16">
          {groups.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.05}>
              <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
                <div className="flex flex-col gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <g.icon className="size-5" />
                  </span>
                  <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
                    {g.title}
                  </h2>
                </div>
                <FaqAccordion items={g.items} />
              </div>
            </Reveal>
          ))}
        </div>

        {/* still have questions */}
        <Reveal className="mt-20">
          <div className="glass flex flex-col items-center gap-5 rounded-3xl p-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
              <HelpCircle className="size-6" />
            </span>
            <h3 className="font-serif text-2xl text-foreground">
              Still have a question?
            </h3>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Our front desk is happy to help with anything — from trek planning
              to special requests. Reach us anytime.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <LuxLink href="/contact" variant="luxury">
                Contact us
              </LuxLink>
              <LuxLink href={site.whatsapp} variant="glass" shimmer={false}>
                WhatsApp us
              </LuxLink>
            </div>
          </div>
        </Reveal>
      </section>

      <CtaSection
        title="Ready when you are"
        description="Book your room with a view and let us take care of the rest."
        image="/images/rooms-hero.png"
      />
    </>
  )
}
