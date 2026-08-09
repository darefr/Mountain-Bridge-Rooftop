import Link from 'next/link'
import {
  Mountain,
  Phone,
  Mail,
  MapPin,
  Star,
  MessageCircle,
  Share2,
  Globe,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'
import { getT } from '@/lib/i18n/server'
import { getSiteContent } from '@/lib/content'
import { db, ADMIN_EMAIL, ensureLoaded } from '@/lib/db/store'

export async function SiteFooter() {
  const { t } = await getT()
  const site = getSiteContent()
  const year = new Date().getFullYear()

  // Admin-uploaded profile image doubles as the hotel logo; icon is the fallback.
  await ensureLoaded()
  const adminUser =
    db.users.find((u) => u.email === ADMIN_EMAIL) ??
    db.users.find((u) => u.role === 'admin' || u.role === 'super_admin')
  const logo = adminUser?.image

  // Primary navigation, flattened from the real site nav (no invented routes).
  const exploreLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.rooms'), href: '/rooms' },
    { label: t('nav.experiences'), href: '/rooms#experiences' },
    { label: t('nav.amenities'), href: '/rooms#amenities' },
    { label: t('nav.gallery'), href: '/gallery' },
    { label: t('nav.restaurant'), href: '/restaurant' },
    { label: t('nav.menu'), href: '/menu' },
    { label: t('nav.offers'), href: '/offers' },
    { label: t('nav.events'), href: '/events' },
    { label: t('nav.reviews'), href: '/reviews' },
    { label: t('nav.faq'), href: '/faq' },
    { label: t('nav.contact'), href: '/contact' },
    { label: t('nav.attractions'), href: '/attractions' },
  ]

  // Guest / stay links. Policy pages don't exist as standalone routes — the
  // booking, cancellation, terms and privacy details live on the FAQ page, so
  // those link to /faq rather than to invented routes.
  const stayLinks = [
    { label: 'Book Your Stay', href: '/book' },
    { label: 'Check Availability', href: '/book' },
    { label: 'My Account', href: '/account' },
    { label: 'Manage Booking', href: '/account' },
    { label: 'Booking Information', href: '/faq' },
    { label: 'Cancellation Policy', href: '/faq' },
    { label: 'Terms & Conditions', href: '/faq' },
    { label: 'Privacy Policy', href: '/faq' },
  ]

  // Destination links — presented as places to explore, tied to real pages.
  const destinationLinks = [
    { label: 'Annapurna Circuit', href: '/attractions' },
    { label: 'Pisang Village', href: '/attractions' },
    { label: 'Manang Valley', href: '/attractions' },
    { label: 'Things to Do', href: '/attractions#itineraries' },
    { label: 'Getting Here', href: '/contact' },
    { label: 'Our Story', href: '/about' },
  ]

  const socials = [
    { href: site.social.facebook, label: 'Facebook', Icon: Share2 },
    { href: site.social.instagram, label: 'Instagram', Icon: Share2 },
    { href: site.social.youtube, label: 'YouTube', Icon: Share2 },
    { href: site.social.tripadvisor, label: 'Tripadvisor', Icon: Globe },
  ].filter((s) => s.href)

  // Long-form, human-readable SEO content. Real room names, real altitude and
  // real dishes only — no invented facilities, prices or menu items.
  const seoSections = [
    {
      title: `Hotel in Pisang, Manang, Nepal`,
      body: `${site.fullName} is a boutique Himalayan retreat in the village of Pisang, high in the Manang district of Nepal. Sitting at around ${site.altitude} on the Annapurna Circuit, the hotel pairs comfortable mountain accommodation with genuine local hospitality, making it a restful base for travellers making their way through the Annapurna region.`,
    },
    {
      title: `Stay Along the Annapurna Circuit`,
      body: `Pisang is one of the most scenic stops on the Annapurna Circuit, a natural place to pause, acclimatise and take in the surrounding peaks. Whether you are trekking towards Manang or simply exploring Himalayan Nepal, our rooms offer a warm, quiet retreat after a day on the trail, with mountain views close at hand.`,
    },
    {
      title: `Comfortable Mountain Accommodation`,
      body: `Choose from our Valley View Room, the spacious Bridge Deluxe, or the Summit Suite — each designed for restful nights at altitude. Every room blends cosy comfort with the calm of the mountains, so you can recharge before the next stage of your journey through the Annapurna region.`,
    },
    {
      title: `Rooftop Restaurant in Pisang`,
      body: `Our rooftop restaurant is the heart of a stay here, serving hearty Himalayan classics and continental favourites beneath open mountain skies. From refillable Dal Bhat and steamed momos to wood-oven pizza and a warming Masala Chai, it is a welcoming place to share a meal with fellow travellers.`,
    },
    {
      title: `Explore Pisang & Manang`,
      body: `Beyond the hotel, Pisang and the wider Manang valley reward those who linger — old stone villages, monasteries, and sweeping Himalayan landscapes shaped by generations of local culture. Our team is always happy to share suggestions for short walks, viewpoints and day trips around the Annapurna region.`,
    },
    {
      title: `Plan Your Stay`,
      body: `Ready to visit? Explore our rooms, check availability for your dates, and reserve your stay in just a few steps. If you have any questions about travelling to Pisang or planning your route through Manang, our front desk is only a message away.`,
    },
  ]

  return (
    <footer className="relative border-t border-border/50 bg-card/40">
      {/* ── CTA band ─────────────────────────────────────────────── */}
      <div className="border-b border-border/50">
        <div className="container-luxe py-10 sm:py-12">
          <div className="glass flex flex-col items-center gap-6 rounded-2xl px-6 py-8 text-center sm:px-10 md:flex-row md:justify-between md:text-left">
            <div className="flex flex-col gap-2">
              <p className="eyebrow justify-center md:justify-start">{site.tagline}</p>
              <h2 className="text-balance font-serif text-2xl text-foreground sm:text-3xl">
                Book your Himalayan stay in Pisang
              </h2>
              <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                Mountain-view rooms and rooftop dining on the Annapurna Circuit, ready when you are.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Book Your Stay
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/rooms"
                className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Explore Rooms
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top: brand + link columns + contact ──────────────────── */}
      <div className="container-luxe py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-primary/15 ring-1 ring-primary/30">
                {logo ? (
                  // Admin-uploaded logo may be a data URL, which next/image rejects.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo || '/placeholder.svg'} alt={`${site.name} logo`} className="size-full object-cover" />
                ) : (
                  <Mountain className="size-4.5 text-primary" />
                )}
              </span>
              <span className="font-serif text-lg text-foreground">{site.name}</span>
            </div>
            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              Discover a peaceful Himalayan stay in Pisang, Manang, where mountain landscapes, warm
              hospitality, comfortable rooms and rooftop dining come together along the Annapurna
              region.
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <div className="flex gap-0.5 text-primary" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary" />
                ))}
              </div>
              <span>{site.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                · {site.reviewsCount} {t('footer.reviews')}
              </span>
            </div>
            {socials.length > 0 && (
              <div className="mt-1 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="glass grid size-9 place-items-center rounded-full text-foreground/80 transition-colors hover:text-primary"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* explore */}
          <nav aria-label="Explore" className="flex flex-col gap-3">
            <h3 className="font-serif text-base text-foreground">{t('footer.explore')}</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* stay */}
          <nav aria-label="Stay" className="flex flex-col gap-3">
            <h3 className="font-serif text-base text-foreground">Stay</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {stayLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* destination */}
          <nav aria-label="Destination" className="flex flex-col gap-3">
            <h3 className="font-serif text-base text-foreground">Destination</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pisang · Manang · Nepal
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {destinationLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base text-foreground">{t('footer.reachUs')}</h3>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  {site.address}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-primary" />
                <a href={site.phoneHref} className="transition-colors hover:text-primary">
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${site.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {site.email}
                </a>
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <a
                href={site.phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Phone className="size-4" /> Call Hotel
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
              <a
                href={`mailto:${site.email}`}
                className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" /> Email Hotel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEO information section ───────────────────────────────── */}
      <div className="border-t border-border/50 bg-background/40">
        <div className="container-luxe py-14 sm:py-16">
          <div className="mb-8 flex flex-col gap-2">
            <p className="eyebrow">About the hotel</p>
            <h2 className="text-balance font-serif text-2xl text-foreground sm:text-3xl">
              A Himalayan retreat in Pisang, on the Annapurna Circuit
            </h2>
          </div>
          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {seoSections.map((s) => (
              <section key={s.title} className="flex flex-col gap-2">
                <h3 className="font-serif text-base text-foreground">{s.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          {/* Plan-your-stay quick links */}
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { label: 'Explore Rooms', href: '/rooms' },
              { label: 'Check Availability', href: '/book' },
              { label: 'Book a Stay', href: '/book' },
              { label: 'Contact the Hotel', href: '/contact' },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                {l.label}
                <ArrowUpRight className="size-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom: copyright + legal ────────────────────────────── */}
      <div className="border-t border-border/50">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p className="text-center sm:text-left">
            © {year} {site.fullName}. {t('footer.rights')}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/faq" className="transition-colors hover:text-primary">
              Terms
            </Link>
            <Link href="/faq" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/faq" className="transition-colors hover:text-primary">
              Cancellation
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              {t('nav.contact')}
            </Link>
          </nav>
          <p className="flex items-center gap-1.5">
            <span>{t('footer.handcrafted')}</span>
            <Mountain className="size-3.5 text-primary" />
          </p>
        </div>
      </div>
    </footer>
  )
}
