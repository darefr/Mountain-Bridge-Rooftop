export const site = {
  name: 'Hotel Mountain Bridge',
  fullName: 'Hotel Mountain Bridge & Rooftop Restaurant',
  tagline: 'A Himalayan haven on the Annapurna Circuit',
  altitude: '3,300 m',
  location: 'Pisang 33500, Manang, Nepal',
  plusCode: 'J583+87 Pisang, Nepal',
  phone: '+977 980-3607949',
  phoneHref: 'tel:+9779803607949',
  whatsapp: 'https://wa.me/9779803607949',
  email: 'stay@mountainbridgepisang.com',
  facebook: 'https://facebook.com',
  rating: 5.0,
  reviewsCount: '600+',
  mapsUrl: 'https://maps.app.goo.gl/scdoeEkhABbK6KCv7',
  mapsEmbed:
    'https://www.google.com/maps?q=Pisang,Manang,Nepal&z=12&output=embed',
}

export type NavChild = { label: string; href: string; desc?: string; tKey?: string }
export type NavItem = { label: string; href?: string; children?: NavChild[]; tKey?: string }

export const navItems: NavItem[] = [
  { label: 'Home', href: '/', tKey: 'nav.home' },
  {
    label: 'Stay',
    tKey: 'nav.stay',
    children: [
      { label: 'Rooms', href: '/rooms', desc: 'Boutique mountain-view rooms', tKey: 'nav.rooms' },
      {
        label: 'Experiences',
        href: '/rooms#experiences',
        desc: 'Sunrise decks & fireside evenings',
        tKey: 'nav.experiences',
      },
      {
        label: 'Amenities',
        href: '/rooms#amenities',
        desc: 'Comfort at high altitude',
        tKey: 'nav.amenities',
      },
      { label: 'Offers', href: '/offers', desc: 'Seasonal stay packages', tKey: 'nav.offers' },
    ],
  },
  {
    label: 'Dine',
    tKey: 'nav.dine',
    children: [
      {
        label: 'Rooftop Restaurant',
        href: '/restaurant',
        desc: 'Panoramic Himalayan dining',
        tKey: 'nav.restaurant',
      },
      { label: 'Menu', href: '/menu', desc: 'Nepali & continental plates', tKey: 'nav.menu' },
      {
        label: 'Table Reservation',
        href: '/restaurant#reserve',
        desc: 'Book your window seat',
        tKey: 'nav.tableReservation',
      },
      { label: 'Events', href: '/events', desc: 'Private & seasonal events', tKey: 'nav.events' },
    ],
  },
  {
    label: 'Explore',
    tKey: 'nav.explore',
    children: [
      { label: 'Gallery', href: '/gallery', desc: 'Rooms, food & summits', tKey: 'nav.gallery' },
      {
        label: 'Attractions',
        href: '/attractions',
        desc: 'Around Pisang & Annapurna',
        tKey: 'nav.attractions',
      },
      {
        label: 'Things to Do',
        href: '/attractions#itineraries',
        desc: 'Curated trek itineraries',
        tKey: 'nav.thingsToDo',
      },
    ],
  },
  {
    label: 'About',
    tKey: 'nav.about',
    children: [
      { label: 'Our Story', href: '/about', desc: 'The Mountain Bridge story', tKey: 'nav.ourStory' },
      { label: 'Reviews', href: '/reviews', desc: 'Words from our guests', tKey: 'nav.reviews' },
      { label: 'FAQ', href: '/faq', desc: 'Everything you need to know', tKey: 'nav.faq' },
      { label: 'Contact', href: '/contact', desc: 'Reach the front desk', tKey: 'nav.contact' },
    ],
  },
]
