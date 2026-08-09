import Image from 'next/image'
import type { Metadata } from 'next'
import { Flame, Music, PartyPopper, Users, Calendar, ArrowRight } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { CtaSection } from '@/components/cta-section'
import { ReservationForm } from '@/components/reservation-form'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { LuxLink } from '@/components/ui/lux-button'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Private dinners, bonfire nights and seasonal celebrations on the rooftop at Hotel Mountain Bridge, Pisang.',
}

const eventTypes = [
  { icon: Flame, title: 'Bonfire nights', desc: 'Gather around the fire under a blanket of stars with music and warm drinks.' },
  { icon: PartyPopper, title: 'Festive celebrations', desc: 'We mark Dashain, Tihar and New Year with special feasts on the rooftop.' },
  { icon: Users, title: 'Group & trek events', desc: 'Welcome dinners and send-offs for trekking groups, tailored to your itinerary.' },
  { icon: Music, title: 'Live folk evenings', desc: 'Occasional evenings of local Nepali music and stories from the mountains.' },
]

const upcoming = [
  { date: 'Every clear evening', title: 'Sunset & bonfire on the terrace', tag: 'Nightly' },
  { date: 'Oct – Nov', title: 'Tihar Festival of Lights dinner', tag: 'Seasonal' },
  { date: 'Dec 31', title: 'New Year under the peaks', tag: 'Special' },
  { date: 'On request', title: 'Private group welcome feast', tag: 'Bespoke' },
]

export default function EventsPage() {
  return (
    <>
      <PageHero
        image="/images/events-hero.png"
        alt="A rooftop bonfire gathering under the stars"
        eyebrow="Events"
        title="Gather under the stars"
        description="From bonfire nights to festive feasts, the rooftop comes alive after dark. Celebrate the mountains with new friends from around the world."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Events' }]}
      />

      {/* Intro */}
      <section className="container-luxe grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <SectionHeading
          eyebrow="The rooftop after dark"
          title="Where trekkers become friends"
          description="There's a special magic to evenings in Pisang. The trail's aches fade, the fire crackles, and travellers from every corner of the world share stories beneath the glowing peaks."
        />
        <Reveal delay={0.1}>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Whether it's a spontaneous bonfire, a seasonal festival or a private
            celebration for your group, we'll set the scene — warm blankets,
            hearty food and the finest view in the valley.
          </p>
        </Reveal>
      </section>

      {/* Event types */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="What we host"
            title="Evenings to remember"
            align="center"
            className="mx-auto mb-14 max-w-2xl"
          />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {eventTypes.map((e) => (
              <StaggerItem key={e.title}>
                <div className="glass h-full rounded-3xl p-7">
                  <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <e.icon className="size-5" />
                  </span>
                  <h3 className="font-serif text-xl text-foreground">{e.title}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {e.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Upcoming */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="On the calendar"
          title="What's coming up"
        />
        <div className="mt-12 flex flex-col divide-y divide-border/60 rounded-3xl border border-border/60 bg-card/40">
          {upcoming.map((u, i) => (
            <Reveal key={u.title} delay={i * 0.06}>
              <div className="group flex flex-col gap-3 p-6 transition-colors hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Calendar className="size-5" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl text-foreground">
                      {u.title}
                    </span>
                    <span className="text-sm text-muted-foreground">{u.date}</span>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-primary/12 px-3 py-1 text-xs text-primary">
                  {u.tag}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Split image + book */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal y={40}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src="/images/lounge.png"
                alt="The lounge set for a gathering"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Host with us"
              title="Plan your private event"
              description="Celebrating a summit, a birthday, or simply the joy of the mountains? Tell us what you have in mind and we'll craft the perfect rooftop evening."
            />
            <Reveal delay={0.1}>
              <LuxLink href="#enquire" variant="luxury" size="lg">
                Enquire now <ArrowRight className="size-4" />
              </LuxLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section id="enquire" className="container-luxe py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow="Event enquiry"
            title="Tell us about your evening"
            align="center"
            className="mb-10"
          />
          <Reveal y={30}>
            <ReservationForm />
          </Reveal>
        </div>
      </section>

      <CtaSection
        title="Let's celebrate the mountains"
        description="Book your stay and join us on the rooftop for an evening you won't forget."
        image="/images/events-hero.png"
      />
    </>
  )
}
