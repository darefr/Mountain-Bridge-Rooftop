import type { Metadata } from 'next'
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Footprints,
  Mountain,
  Clock,
} from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { SectionHeading } from '@/components/section-heading'
import { ContactForm } from '@/components/contact-form'
import { FaqAccordion } from '@/components/faq-accordion'
import { CtaSection } from '@/components/cta-section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { site } from '@/lib/site'
import { faqs } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Hotel Mountain Bridge in Pisang — call, WhatsApp, email or visit us on the Annapurna Circuit.',
}

const channels = [
  { icon: Phone, label: 'Call us', value: site.phone, href: site.phoneHref },
  { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: site.whatsapp },
  { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
  { icon: MapPin, label: 'Address', value: site.location, href: site.mapsUrl },
]

const landmarks = [
  { icon: Footprints, title: 'On the Annapurna Circuit', desc: 'Directly on the main trail between Chame and Manang.' },
  { icon: Mountain, title: 'Below the peaks', desc: 'At the foot of Pisang Peak, facing Annapurna II.' },
  { icon: Navigation, title: `Plus code ${site.plusCode}`, desc: 'Drop this into Google Maps for pinpoint directions.' },
]

export default function ContactPage() {
  return (
    <>
      <PageHero
        image="/images/contact-hero.png"
        alt="Aerial view of Pisang village in the valley"
        eyebrow="Contact"
        title="Let's plan your stay"
        description="Whether you're booking a room, reserving a table or planning your trek, our front desk is here to help — reach us however suits you best."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      {/* Channels */}
      <section className="container-luxe py-20 sm:py-28">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => (
            <StaggerItem key={c.label}>
              <a
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="glass group flex h-full flex-col gap-3 rounded-3xl p-6 transition-colors hover:border-primary/40"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                  <c.icon className="size-5" />
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <span className="text-pretty font-medium text-foreground transition-colors group-hover:text-primary">
                  {c.value}
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Form + info */}
      <section className="border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Send a message"
              title="We'll get back to you"
              description="Fill in the form and our team will reply as soon as the mountain connection allows. For urgent requests, WhatsApp is fastest."
            />
            <Reveal delay={0.1}>
              <div className="glass flex items-center gap-4 rounded-2xl p-5">
                <Clock className="size-6 shrink-0 text-primary" />
                <div className="flex flex-col text-sm">
                  <span className="font-medium text-foreground">Front desk hours</span>
                  <span className="text-muted-foreground">
                    Open daily · 6:00am – 10:00pm (NPT)
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border/60">
                <iframe
                  title="Map of Hotel Mountain Bridge, Pisang"
                  src={site.mapsEmbed}
                  className="absolute inset-0 h-full w-full grayscale-[0.3] contrast-110"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={30}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* Directions / landmarks */}
      <section className="container-luxe py-20 sm:py-28">
        <SectionHeading
          eyebrow="Finding us"
          title="Directions & landmarks"
          align="center"
          className="mx-auto mb-14 max-w-2xl"
        />
        <Stagger className="grid gap-5 md:grid-cols-3">
          {landmarks.map((l) => (
            <StaggerItem key={l.title}>
              <div className="glass h-full rounded-3xl p-7">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <l.icon className="size-5" />
                </span>
                <h3 className="font-serif text-xl text-foreground">{l.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {l.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="container-luxe grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow="Quick answers" title="Before you reach out" />
          <FaqAccordion items={faqs.slice(0, 4)} />
        </div>
      </section>

      <CtaSection
        title="Your mountain welcome awaits"
        description="Reach out today and let's craft the perfect Himalayan stay for you."
        image="/images/hero-lodge-night.png"
      />
    </>
  )
}
