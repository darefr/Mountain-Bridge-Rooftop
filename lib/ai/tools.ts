import { tool, jsonSchema } from 'ai'
import { db } from '@/lib/db/store'
import { site } from '@/lib/site'
import { rooms as roomContent, menu, offers, attractions, faqs } from '@/lib/data'
import {
  availability,
  quote,
  nightsBetween,
  unitsAvailable,
  USD_TO_NPR,
  TAX_RATE,
  SERVICE_RATE,
} from '@/lib/booking'
import { availableSlots, largestTableSeats } from '@/lib/restaurant'
import { SLOT_GROUPS } from '@/lib/restaurant-slots'
import { createReservationFromAI } from '@/lib/ai/actions'

const npr = (usd: number) => Math.round(usd * USD_TO_NPR)

function roomContentFor(slug: string) {
  return roomContent.find((r) => r.slug === slug)
}

// Build the /book deep link the UI uses to prefill the existing booking flow.
function bookingUrl(opts: {
  roomSlug?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  rooms?: number
}) {
  const p = new URLSearchParams()
  if (opts.checkIn) p.set('checkIn', opts.checkIn)
  if (opts.checkOut) p.set('checkOut', opts.checkOut)
  if (opts.guests) p.set('guests', String(opts.guests))
  if (opts.rooms) p.set('rooms', String(opts.rooms))
  if (opts.roomSlug) p.set('room', opts.roomSlug)
  const qs = p.toString()
  return qs ? `/book?${qs}` : '/book'
}

export const conciergeTools = {
  getHotelInfo: tool({
    description:
      'Get core facts about the hotel: name, location, altitude, contact details, check-in/out times and restaurant hours. Use for general "tell me about the hotel / where are you" questions.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => {
      const s = db.settings
      return {
        name: site.fullName,
        location: site.location,
        altitude: site.altitude,
        phone: site.phone,
        email: site.email,
        whatsapp: site.whatsapp,
        checkInTime: s.checkInTime,
        checkOutTime: s.checkOutTime,
        restaurantHours: s.restaurantHours,
        tagline: site.tagline,
        mapsUrl: site.mapsUrl,
      }
    },
  }),

  getRooms: tool({
    description:
      'List every room type with live nightly price (USD and NPR), max guests and amenities. Use when the guest asks what rooms exist, cheapest room, or room comparisons.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      currencyNote: 'Prices are per night. Taxes and service charge are added at checkout.',
      rooms: db.rooms
        .filter((r) => r.active !== false)
        .map((r) => {
          const c = roomContentFor(r.slug)
          return {
            slug: r.slug,
            name: r.name,
            image: r.image,
            priceUSD: r.priceUSD,
            priceNPR: npr(r.priceUSD),
            maxGuests: r.maxGuests,
            amenities: r.amenities,
            blurb: c?.blurb ?? r.description,
            size: c?.size,
            bed: c?.bed,
          }
        }),
    }),
  }),

  getRoomDetails: tool({
    description: 'Get full detail for one room type by its slug (valley, deluxe or suite).',
    inputSchema: jsonSchema<{ roomSlug: string }>({
      type: 'object',
      properties: {
        roomSlug: { type: 'string', enum: ['valley', 'deluxe', 'suite'], description: 'Room slug' },
      },
      required: ['roomSlug'],
    }),
    execute: async ({ roomSlug }) => {
      const r = db.rooms.find((x) => x.slug === roomSlug)
      if (!r) return { error: 'Unknown room. Available: valley, deluxe, suite.' }
      const c = roomContentFor(roomSlug)
      return {
        slug: r.slug,
        name: r.name,
        image: r.image,
        priceUSD: r.priceUSD,
        priceNPR: npr(r.priceUSD),
        maxGuests: r.maxGuests,
        amenities: r.amenities,
        blurb: c?.blurb ?? r.description,
        size: c?.size,
        bed: c?.bed,
      }
    },
  }),

  checkRoomAvailability: tool({
    description:
      'Check real-time room availability for a date range. Requires ISO dates (YYYY-MM-DD). Returns each room with units available and an estimated total for the stay. Only call once you know check-in, check-out and ideally the guest count. Resolve relative dates (e.g. "next Friday") to ISO dates yourself using the current date.',
    inputSchema: jsonSchema<{ checkIn: string; checkOut: string; guests?: number; rooms?: number }>({
      type: 'object',
      properties: {
        checkIn: { type: 'string', description: 'Check-in date, YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date, YYYY-MM-DD' },
        guests: { type: 'number', description: 'Total guests' },
        rooms: { type: 'number', description: 'Number of rooms wanted (default 1)' },
      },
      required: ['checkIn', 'checkOut'],
    }),
    execute: async ({ checkIn, checkOut, guests, rooms }) => {
      const nights = nightsBetween(checkIn, checkOut)
      if (!checkIn || !checkOut || nights < 1) {
        return { error: 'Please provide a valid check-in and a later check-out date.' }
      }
      const roomsWanted = Math.max(1, rooms || 1)
      const rows = availability(checkIn, checkOut)
        .filter((r) => (guests ? r.maxGuests * roomsWanted >= guests : true))
        .map((r) => {
          const q = quote({ roomSlug: r.slug, checkIn, checkOut, rooms: roomsWanted, currency: 'USD' })
          return {
            slug: r.slug,
            name: r.name,
            image: r.image,
            priceUSD: r.priceUSD,
            priceNPR: npr(r.priceUSD),
            maxGuests: r.maxGuests,
            available: r.available,
            soldOut: r.available < roomsWanted,
            estimatedTotalUSD: q.total,
            estimatedTotalNPR: npr(q.total),
            bookUrl: bookingUrl({ roomSlug: r.slug, checkIn, checkOut, guests, rooms: roomsWanted }),
          }
        })
      return { checkIn, checkOut, nights, guests: guests ?? null, rooms: roomsWanted, results: rows }
    },
  }),

  createBookingDraft: tool({
    description:
      'Prepare a room booking for the guest to confirm. Does NOT confirm or charge anything — it returns a summary and a link that opens the existing booking page with the details prefilled. Use after the guest picks a room and you know dates. Always let the guest do the final confirmation on the booking page.',
    inputSchema: jsonSchema<{
      roomSlug: string
      checkIn: string
      checkOut: string
      guests?: number
      rooms?: number
    }>({
      type: 'object',
      properties: {
        roomSlug: { type: 'string', enum: ['valley', 'deluxe', 'suite'] },
        checkIn: { type: 'string', description: 'YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'YYYY-MM-DD' },
        guests: { type: 'number' },
        rooms: { type: 'number' },
      },
      required: ['roomSlug', 'checkIn', 'checkOut'],
    }),
    execute: async ({ roomSlug, checkIn, checkOut, guests, rooms }) => {
      const room = db.rooms.find((r) => r.slug === roomSlug)
      const nights = nightsBetween(checkIn, checkOut)
      if (!room) return { error: 'Unknown room type.' }
      if (nights < 1) return { error: 'Check-out must be after check-in.' }
      const roomsWanted = Math.max(1, rooms || 1)
      const avail = unitsAvailable(roomSlug, checkIn, checkOut)
      if (avail < roomsWanted) {
        return {
          error: `Only ${avail} ${room.name} left for those dates.`,
          soldOut: true,
          available: avail,
        }
      }
      const q = quote({ roomSlug, checkIn, checkOut, rooms: roomsWanted, currency: 'USD' })
      return {
        draft: true,
        roomSlug,
        roomName: room.name,
        image: room.image,
        checkIn,
        checkOut,
        nights,
        guests: guests ?? null,
        rooms: roomsWanted,
        nightlyUSD: room.priceUSD,
        estimatedTotalUSD: q.total,
        estimatedTotalNPR: npr(q.total),
        taxAndServicePct: Math.round((TAX_RATE + SERVICE_RATE) * 100),
        bookUrl: bookingUrl({ roomSlug, checkIn, checkOut, guests, rooms: roomsWanted }),
      }
    },
  }),

  getRestaurantMenu: tool({
    description: 'Get the rooftop restaurant menu (categories, dishes, prices). Use for food/menu questions.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      categories: menu.map((c) => ({
        title: c.title,
        items: c.items.map((i) => ({ name: i.name, desc: i.desc, price: i.price, tag: i.tag })),
      })),
    }),
  }),

  getRestaurantInfo: tool({
    description: 'Get rooftop restaurant details: opening hours, seating and how reservations work.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      hours: db.settings.restaurantHours,
      seatingGroups: SLOT_GROUPS.map((g) => ({ service: g.label, times: g.times })),
      largestTableSeats: largestTableSeats(),
      note: 'Breakfast from 6:30am, all-day dining until 9:30pm. Vegetarian and vegan options always available.',
    }),
  }),

  checkRestaurantAvailability: tool({
    description:
      'Check which restaurant seating times are still free for a given date and party size. Requires ISO date (YYYY-MM-DD). Resolve relative dates like "tonight"/"tomorrow" yourself.',
    inputSchema: jsonSchema<{ date: string; guests: number }>({
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        guests: { type: 'number', description: 'Party size' },
      },
      required: ['date', 'guests'],
    }),
    execute: async ({ date, guests }) => {
      const party = Math.max(1, Number(guests) || 2)
      const slots = availableSlots(date, party)
      return { date, guests: party, slots, anyAvailable: slots.length > 0 }
    },
  }),

  createRestaurantReservation: tool({
    description:
      'Create a confirmed restaurant table reservation. Only call this AFTER the guest has explicitly confirmed all of: name, phone number, date, time and party size. Do not invent any of these values. Returns a confirmation reference on success, or alternative times if that slot is full.',
    inputSchema: jsonSchema<{
      date: string
      time: string
      guests: number
      name: string
      phone: string
      email?: string
      requests?: string
    }>({
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM 24h, e.g. 19:30' },
        guests: { type: 'number' },
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        requests: { type: 'string', description: 'Any special requests' },
      },
      required: ['date', 'time', 'guests', 'name', 'phone'],
    }),
    execute: async (input) => createReservationFromAI(input),
  }),

  getOffers: tool({
    description: 'List current stay packages / offers and what each includes.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      offers: db.offers
        .filter((o) => o.active !== false)
        .map((o) => ({
          title: o.title,
          tag: o.tag,
          image: o.image,
          desc: o.desc,
          includes: o.includes,
          price: o.price,
        })),
    }),
  }),

  getHotelPolicies: tool({
    description: 'Get hotel policies: cancellation, payment methods, check-in/out, altitude guidance.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      checkInTime: db.settings.checkInTime,
      checkOutTime: db.settings.checkOutTime,
      cancellation: 'Free cancellation on most bookings — tell us as early as you can.',
      paymentMethods: ['eSewa', 'Khalti', 'Fonepay', 'Pay at hotel (cash NPR)'],
      taxes: `${Math.round(TAX_RATE * 100)}% VAT + ${Math.round(SERVICE_RATE * 100)}% service charge on stays.`,
      faqs: faqs.map((f) => ({ q: f.q, a: f.a })),
    }),
  }),

  getContactInfo: tool({
    description: 'Get contact details and directions: phone, WhatsApp, email, map and how to reach Pisang.',
    inputSchema: jsonSchema<Record<string, never>>({ type: 'object', properties: {} }),
    execute: async () => ({
      phone: site.phone,
      whatsapp: site.whatsapp,
      email: site.email,
      location: site.location,
      mapsUrl: site.mapsUrl,
      gettingThere:
        'Pisang is on the Annapurna Circuit in Manang. Most guests trek in from Chame or take a jeep along the Besisahar–Manang road. We can help arrange a jeep transfer.',
      attractions: attractions.map((a) => ({ title: a.title, distance: a.distance, desc: a.desc })),
    }),
  }),
} as const
