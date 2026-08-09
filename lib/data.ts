export type Review = {
  name: string
  country: string
  text: string
  rating: number
  trip: string
}

export const reviews: Review[] = [
  {
    name: 'Elena Rossi',
    country: 'Italy',
    rating: 5,
    trip: 'Annapurna Circuit trek',
    text: 'The best stop on the entire circuit. Our room framed Annapurna II like a painting, and the rooftop dal bhat gave us the energy to push on. Warm, genuine hospitality.',
  },
  {
    name: 'James Whitfield',
    country: 'United Kingdom',
    rating: 5,
    trip: 'Solo trekking',
    text: 'I arrived exhausted and left recharged. Hot shower, a wood stove in the lounge, and the kindest hosts. The sunrise from the terrace is unforgettable.',
  },
  {
    name: 'Sofia Andersson',
    country: 'Sweden',
    rating: 5,
    trip: 'Couple’s getaway',
    text: 'A candlelit dinner on the rooftop under the stars, with the peaks glowing pink at dusk. Impeccable service and the momos were incredible.',
  },
  {
    name: 'Daniel Kim',
    country: 'South Korea',
    rating: 5,
    trip: 'Photography expedition',
    text: 'The location is unbeatable for photography. Every window is a viewpoint. Staff even woke me for the perfect alpenglow shot. Highly recommend the Summit Suite.',
  },
  {
    name: 'Marie Dubois',
    country: 'France',
    rating: 5,
    trip: 'Acclimatization stop',
    text: 'Clean, cozy and calm — exactly what you need at altitude. The wood-fired pizza was a delightful surprise this high in the mountains.',
  },
  {
    name: 'Liam O’Connor',
    country: 'Ireland',
    rating: 5,
    trip: 'Group trek',
    text: 'Our whole group stayed here and everyone raved about it. Great value, generous portions and a rooftop that feels like the top of the world.',
  },
]

export type Room = {
  slug: string
  name: string
  image: string
  blurb: string
  price: string
  size: string
  guests: string
  bed: string
  features: string[]
}

export const rooms: Room[] = [
  {
    slug: 'valley',
    name: 'Valley View Room',
    image: '/images/room-valley.png',
    blurb:
      'A snug, sunlit room with a window framing the Marsyangdi valley — perfect for a restful night between trekking days.',
    price: 'from $38',
    size: '18 m²',
    guests: '2 guests',
    bed: 'Queen bed',
    features: ['Valley-facing window', 'Hot shower', 'Wool bedding', 'Charging points'],
  },
  {
    slug: 'deluxe',
    name: 'Bridge Deluxe',
    image: '/images/room-deluxe.png',
    blurb:
      'Our signature room with a sitting nook and floor-to-ceiling views of the Annapurna range — space to spread out and slow down.',
    price: 'from $58',
    size: '26 m²',
    guests: '2–3 guests',
    bed: 'King bed',
    features: ['Panoramic peak views', 'Sitting nook', 'Ensuite bath', 'Brass reading lamps'],
  },
  {
    slug: 'suite',
    name: 'Summit Suite',
    image: '/images/room-suite.png',
    blurb:
      'The top-floor suite with wraparound windows, a glowing wood stove and the most dramatic mountain panorama on the property.',
    price: 'from $88',
    size: '38 m²',
    guests: '2–4 guests',
    bed: 'King + daybed',
    features: ['Wraparound views', 'Wood stove', 'Soaking tub', 'Private terrace'],
  },
]

export type MenuItem = { name: string; desc: string; price: string; tag?: string }
export type MenuCategory = { title: string; items: MenuItem[] }

export const menu: MenuCategory[] = [
  {
    title: 'Himalayan Classics',
    items: [
      { name: 'Dal Bhat Power', desc: 'Rice, lentil soup, seasonal curry, greens & pickle — refillable', price: '$6', tag: 'Trekker favourite' },
      { name: 'Steamed Momos', desc: 'Vegetable or buff dumplings with tomato achar', price: '$5' },
      { name: 'Thukpa', desc: 'Tibetan noodle soup with vegetables & herbs', price: '$5' },
      { name: 'Sherpa Stew', desc: 'Hearty potato, vegetable & dumpling broth', price: '$6' },
    ],
  },
  {
    title: 'From the Wood Oven',
    items: [
      { name: 'Margherita Pizza', desc: 'Tomato, mozzarella, fresh basil', price: '$8', tag: 'Signature' },
      { name: 'Yak Cheese Pizza', desc: 'Local yak cheese, herbs, chilli honey', price: '$9' },
      { name: 'Garlic Naan', desc: 'Clay-oven flatbread with garlic butter', price: '$3' },
    ],
  },
  {
    title: 'Breakfast Summit',
    items: [
      { name: 'Tibetan Bread & Honey', desc: 'Fried bread with local wildflower honey', price: '$4' },
      { name: 'Masala Omelette', desc: 'Three eggs, onion, tomato, chilli, herbs', price: '$4' },
      { name: 'Porridge & Apple', desc: 'Oats, cinnamon, stewed Marpha apple', price: '$4' },
    ],
  },
  {
    title: 'Warm Drinks',
    items: [
      { name: 'Masala Chai', desc: 'Spiced Himalayan milk tea', price: '$2' },
      { name: 'Hot Lemon, Ginger & Honey', desc: 'The trekker’s remedy', price: '$2' },
      { name: 'Filter Coffee', desc: 'Locally roasted Nepali beans', price: '$3' },
    ],
  },
]

export type Offer = {
  title: string
  tag: string
  image: string
  desc: string
  includes: string[]
  price: string
}

export const offers: Offer[] = [
  {
    title: 'Acclimatization Retreat',
    tag: 'Most popular',
    image: '/images/offers-hero.png',
    desc: 'Two restful nights to adjust to altitude before the Thorong La pass, with guided short hikes and hearty meals.',
    includes: ['2 nights Bridge Deluxe', 'Daily breakfast & dinner', 'Guided acclimatization walk', 'Late checkout'],
    price: 'from $149',
  },
  {
    title: 'Rooftop Romance',
    tag: 'For two',
    image: '/images/rooftop-dining.png',
    desc: 'A candlelit private dinner under the stars, a Summit Suite night and a sunrise breakfast for two.',
    includes: ['1 night Summit Suite', 'Private rooftop dinner', 'Sunrise breakfast', 'Welcome butter tea'],
    price: 'from $129',
  },
  {
    title: 'Photographer’s Pass',
    tag: 'Seasonal',
    image: '/images/annapurna-peaks.png',
    desc: 'Timed for the clearest skies, with the best-facing suite and a local guide to the finest viewpoints at dawn.',
    includes: ['2 nights peak-facing room', 'Golden-hour wake-up service', 'Local viewpoint guide', 'Thermos & trail snacks'],
    price: 'from $169',
  },
]

export type Attraction = {
  title: string
  distance: string
  image: string
  desc: string
  category: string
}

export const attractions: Attraction[] = [
  {
    title: 'Upper Pisang & Monastery',
    distance: '30 min walk',
    image: '/images/village-pisang.png',
    category: 'Culture',
    desc: 'A traditional Tibetan-style stone village with an ancient gompa and sweeping views over the valley.',
  },
  {
    title: 'Ice Lake (Kicho Tal)',
    distance: 'Full-day hike',
    image: '/images/ice-lake.png',
    category: 'Adventure',
    desc: 'A demanding but rewarding climb to a turquoise glacial lake at over 4,600m — the ultimate acclimatization day.',
  },
  {
    title: 'Annapurna Viewpoints',
    distance: 'From the terrace',
    image: '/images/annapurna-peaks.png',
    category: 'Nature',
    desc: 'Annapurna II, IV and Pisang Peak glow at sunrise and sunset — best enjoyed with tea from our rooftop.',
  },
  {
    title: 'Marsyangdi River Trail',
    distance: 'At the doorstep',
    image: '/images/contact-hero.png',
    category: 'Trekking',
    desc: 'The classic Annapurna Circuit path winds past pine forest and the river, connecting Chame to Manang.',
  },
]

export const galleryImages = [
  { src: '/images/hero-lodge-night.png', alt: 'The lodge at twilight', cat: 'Exterior' },
  { src: '/images/room-suite.png', alt: 'Summit Suite interior', cat: 'Rooms' },
  { src: '/images/rooftop-dining.png', alt: 'Rooftop dining at dusk', cat: 'Restaurant' },
  { src: '/images/annapurna-peaks.png', alt: 'Annapurna peaks at sunrise', cat: 'Mountains' },
  { src: '/images/room-deluxe.png', alt: 'Bridge Deluxe room', cat: 'Rooms' },
  { src: '/images/dish-momos.png', alt: 'Steamed momos', cat: 'Restaurant' },
  { src: '/images/village-pisang.png', alt: 'Upper Pisang village', cat: 'Mountains' },
  { src: '/images/lounge.png', alt: 'Communal lounge with wood stove', cat: 'Experiences' },
  { src: '/images/gallery-exterior.png', alt: 'Hotel exterior at dusk', cat: 'Exterior' },
  { src: '/images/breakfast-view.png', alt: 'Breakfast with a view', cat: 'Restaurant' },
  { src: '/images/ice-lake.png', alt: 'Ice Lake glacial water', cat: 'Mountains' },
  { src: '/images/room-valley.png', alt: 'Valley View room', cat: 'Rooms' },
  { src: '/images/trekkers.png', alt: 'Trekkers on the circuit', cat: 'Experiences' },
  { src: '/images/events-hero.png', alt: 'Rooftop bonfire gathering', cat: 'Experiences' },
]

export const faqs = [
  { q: 'How do I get to Hotel Mountain Bridge in Pisang?', a: 'Pisang lies on the Annapurna Circuit in the Manang district. Most guests arrive on foot trekking from Chame, or by jeep along the Besisahar–Manang road. We can help arrange a jeep transfer — just message us with your dates.' },
  { q: 'Do you help with trekking guides and porters?', a: 'Yes. We work with trusted local guides and porters and can arrange them for onward stages toward Manang, Thorong La and beyond, as well as day hikes to Ice Lake and Upper Pisang.' },
  { q: 'Is there Wi-Fi and charging at this altitude?', a: 'We offer Wi-Fi in common areas and charging points for your devices. At 3,300m connectivity can vary with weather, but we do our best to keep you connected.' },
  { q: 'What meals do you serve?', a: 'Our rooftop restaurant serves breakfast from 6:30am and an all-day menu of Nepali classics, wood-fired pizzas, soups and warming drinks. Vegetarian and vegan options are always available.' },
  { q: 'How should I prepare for the altitude?', a: 'Pisang is an ideal acclimatization stop. We recommend a slow ascent, plenty of water, and a rest day with a short walk to higher ground. Our team keeps an eye on guests and can advise if you feel unwell.' },
  { q: 'What is your cancellation policy?', a: 'We offer free cancellation on most bookings. Because mountain plans change with the weather, just let us know as early as you can and we will do our best to accommodate you.' },
  { q: 'Do you accept card payments?', a: 'We primarily accept cash (Nepali rupees) and can advise on the nearest ATMs along the circuit. For advance bookings, we can arrange alternative payment — contact us for details.' },
  { q: 'Is the hotel family and LGBTQ+ friendly?', a: 'Absolutely. Everyone is welcome at Hotel Mountain Bridge. We pride ourselves on warm, inclusive hospitality for every guest.' },
]
