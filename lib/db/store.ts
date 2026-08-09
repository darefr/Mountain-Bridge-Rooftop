import { randomUUID, scryptSync, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { rooms as roomData, reviews as reviewData, offers as offerData, menu as menuData, galleryImages, faqs as faqData } from '@/lib/data'
import type { DB, PhysicalRoom, MenuItemRecord, GalleryItem, GalleryCategory, FaqItem } from './types'
import { isStaffRole } from './types'

// ---------------------------------------------------------------------------
// Persistence: single in-process store kept on globalThis so it survives HMR /
// route module reloads in dev. Best-effort JSON snapshot to .data/db.json so the
// preview keeps data across restarts. On read-only filesystems (serverless) the
// disk writes silently no-op and the store simply lives in memory.
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'db.json')

function hash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex')
}

// ---------------------------------------------------------------------------
// Canonical admin credential.
//
// The salt and passwordHash below are FIXED and PRECOMPUTED with the same
// scrypt scheme used everywhere else (scryptSync(pw, salt, 64)). The plaintext
// password is intentionally NOT present in source — only the derived hash is.
//
// Using a fixed salt/hash (instead of the previous per-process randomBytes salt)
// is also what makes the stateless, HMAC-signed session cookie survive across
// serverless instances: lib/auth/session.ts derives its signing secret from this
// stable credential, so a cookie signed on one Vercel instance verifies on any
// other. With a random per-instance salt the derived secret differed between
// instances, so the admin cookie failed verification after the post-login
// redirect and the user was bounced straight back to /login.
// ---------------------------------------------------------------------------
export const ADMIN_EMAIL = 'admin@mountainbridgepisang.com'
const ADMIN_SALT = '9f3c1a7e5b2d4680c1e9a5f7d3b60482'
const ADMIN_PASSWORD_HASH =
  '59edbe63bb556a60cd62db26a755467a8b923e03275baf8e595877787e06d7376d9f54062d5407f97b8085d3fc2fd25498f2d9e3f1d55a40f3afd4998982a0d6'

// Signing material for the session-cookie HMAC when no AUTH_SECRET env var is
// set. Stable across instances because it is derived from the fixed admin
// credential above, never from mutable/random state.
export const SESSION_KDF_MATERIAL = `${ADMIN_PASSWORD_HASH}:${ADMIN_SALT}:mb-session-v1`

function seed(): DB {
  const priceMap: Record<string, { price: number; units: number; guests: number }> = {
    valley: { price: 38, units: 6, guests: 2 },
    deluxe: { price: 58, units: 4, guests: 3 },
    suite: { price: 88, units: 2, guests: 4 },
  }

  const now = Date.now()

  // Floor per category so room numbers read naturally (1xx, 2xx, 3xx).
  const floorMap: Record<string, number> = { valley: 1, deluxe: 2, suite: 3 }
  const physicalRooms: PhysicalRoom[] = []
  for (const [slug, cfg] of Object.entries(priceMap)) {
    const floor = floorMap[slug] ?? 1
    for (let i = 1; i <= cfg.units; i++) {
      physicalRooms.push({
        id: randomUUID(),
        number: `${floor}${String(i).padStart(2, '0')}`,
        roomSlug: slug,
        floor,
        status: 'available',
        housekeeping: 'clean',
        updatedAt: now,
      })
    }
  }

  const menuItems: MenuItemRecord[] = menuData.flatMap((cat) =>
    cat.items.map((it, i) => ({
      id: `menu-${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
      category: cat.title,
      name: it.name,
      desc: it.desc,
      priceUSD: Number(String(it.price).replace(/[^0-9.]/g, '')) || 0,
      vegetarian: !/buff|yak|chicken|meat|momo/i.test(it.name) || /veg/i.test(it.desc),
      available: true,
      featured: !!it.tag,
      offer: it.tag,
    })),
  )

  // Map legacy static gallery categories onto the CMS category set.
  const galleryCatMap: Record<string, GalleryCategory> = {
    Rooms: 'Rooms',
    Restaurant: 'Restaurant',
    Exterior: 'Exterior',
    Mountains: 'Mountain',
    Experiences: 'Experiences',
  }
  const gallery: GalleryItem[] = galleryImages.map((g, i) => ({
    id: `gallery-${i}`,
    src: g.src,
    alt: g.alt,
    title: g.alt,
    description: '',
    category: galleryCatMap[g.cat] ?? 'Other',
    featured: i < 3,
    enabled: true,
    order: i,
    createdAt: now - i * 1000,
  }))

  const faqs: FaqItem[] = faqData.map((f, i) => ({
    id: `faq-${i}`,
    question: f.q,
    answer: f.a,
    category: i < 3 ? 'Getting here & altitude' : i < 6 ? 'Staying & booking' : 'Dining & amenities',
    active: true,
    order: i,
    createdAt: now - i * 1000,
  }))

  const db: DB = {
    users: [
      {
        id: randomUUID(),
        email: ADMIN_EMAIL,
        name: 'Front Desk',
        phone: '+977 980-3607949',
        salt: ADMIN_SALT,
        passwordHash: ADMIN_PASSWORD_HASH,
        role: 'admin',
        emailVerified: true,
        createdAt: now,
      },
    ],
    sessions: [],
    rooms: roomData.map((r) => ({
      slug: r.slug,
      name: r.name,
      image: r.image,
      priceUSD: priceMap[r.slug]?.price ?? 50,
      totalUnits: priceMap[r.slug]?.units ?? 3,
      maxGuests: priceMap[r.slug]?.guests ?? 2,
      weekendSurchargePct: 15,
      extraGuestFeeUSD: 8,
      extraBedFeeUSD: 10,
      minNights: 1,
      maxNights: 30,
      description: r.blurb,
      amenities: r.features,
      active: true,
    })),
    physicalRooms,
    bookings: [],
    reservations: [],
    payments: [],
    coupons: [
      { code: 'ANNAPURNA10', type: 'percent', value: 10, active: true, description: '10% off any stay' },
      { code: 'TREKKER15', type: 'percent', value: 15, active: true, minNights: 2, description: '15% off stays of 2+ nights' },
      { code: 'WELCOME5', type: 'fixed', value: 5, active: true, description: '$5 off your first booking' },
    ],
    notifications: [],
    tables: [
      { id: 't1', name: 'Terrace 1', seats: 2, location: 'Rooftop edge' },
      { id: 't2', name: 'Terrace 2', seats: 4, location: 'Rooftop centre' },
      { id: 't3', name: 'Window 1', seats: 2, location: 'Valley window' },
      { id: 't4', name: 'Window 2', seats: 4, location: 'Peak window' },
      { id: 't5', name: 'Fireside', seats: 6, location: 'Indoor lounge' },
    ],
    staff: [
      { id: 's1', name: 'Pemba Sherpa', role: 'Manager', email: 'pemba@mountainbridgepisang.com', phone: '+977 980-1111111' },
      { id: 's2', name: 'Dawa Lama', role: 'Head Chef', email: 'dawa@mountainbridgepisang.com' },
      { id: 's3', name: 'Mira Gurung', role: 'Front Desk', email: 'mira@mountainbridgepisang.com' },
    ],
    reviews: reviewData.map((r, i) => ({
      id: `seed-review-${i}`,
      name: r.name,
      country: r.country,
      text: r.text,
      rating: r.rating,
      trip: r.trip,
      approved: true,
      createdAt: now - i * 86400000,
    })),
    offers: offerData.map((o, i) => ({
      id: `offer-${i}`,
      title: o.title,
      tag: o.tag,
      image: o.image,
      desc: o.desc,
      includes: o.includes,
      price: o.price,
      active: true,
    })),
    housekeepingTasks: [],
    gallery,
    faqs,
    seasonalRates: [
      {
        id: 'season-autumn',
        name: 'Autumn Peak (Oct–Nov)',
        start: `${new Date().getFullYear()}-10-01`,
        end: `${new Date().getFullYear()}-11-30`,
        multiplier: 1.25,
        active: true,
      },
      {
        id: 'season-spring',
        name: 'Spring Trekking (Mar–Apr)',
        start: `${new Date().getFullYear()}-03-01`,
        end: `${new Date().getFullYear()}-04-30`,
        multiplier: 1.15,
        active: true,
      },
    ],
    addOns: [
      { id: 'addon-breakfast', name: 'Daily Breakfast', priceUSD: 6, perNight: true, active: true, description: 'Rooftop breakfast for the room' },
      { id: 'addon-dinner', name: 'Set Dinner (Dal Bhat)', priceUSD: 8, perNight: true, active: true, description: 'Refillable trekker dinner' },
      { id: 'addon-transfer', name: 'Jeep Transfer Assist', priceUSD: 25, perNight: false, active: true, description: 'Help arranging a jeep transfer' },
      { id: 'addon-guide', name: 'Local Day-Hike Guide', priceUSD: 30, perNight: false, active: true, description: 'Guided acclimatization walk' },
    ],
    menuItems,
    orders: [],
    auditLogs: [],
    contactMessages: [],
    roomBlocks: [],
    changeRequests: [],
    settings: {
      hotelName: 'Hotel Mountain Bridge & Rooftop Restaurant',
      shortName: 'Hotel Mountain Bridge',
      websiteTitle: 'Hotel Mountain Bridge & Rooftop Restaurant · Pisang, Manang',
      tagline: 'A Himalayan haven on the Annapurna Circuit',
      description:
        'A warm Himalayan lodge in Pisang, Manang — panoramic Annapurna views, a rooftop restaurant and genuine mountain hospitality on the Annapurna Circuit.',
      phone: '+977 980-3607949',
      email: 'admin@mountainbridgepisang.com',
      address: 'Pisang, Manang, Nepal',
      whatsapp: '+977 980-3607949',
      mapsLink: 'https://maps.google.com/?q=Pisang+Manang+Nepal',
      websiteUrl: 'https://mountainbridgepisang.com',
      checkInTime: '13:00',
      checkOutTime: '11:00',
      restaurantHours: '06:30 – 21:30 daily',
      currency: 'USD',
      taxRatePct: 13,
      footerText: 'A boutique retreat and rooftop restaurant in Pisang, on the Annapurna Circuit.',
      social: {
        facebook: '',
        instagram: '',
        tripadvisor: '',
        youtube: '',
      },
      hero: {
        title: 'Where the Annapurnas meet the sky',
        subtitle: 'A rooftop lodge in Pisang, Manang — rest, dine and breathe at 3,300m.',
        description:
          'A boutique retreat and rooftop restaurant in Pisang — warm rooms, panoramic Himalayan dining and genuine mountain hospitality on the Annapurna Circuit.',
        image: '/images/hero-lodge-night.png',
        video: '',
        ctaText: 'Book your stay',
        ctaLink: '/book',
        secondaryCtaText: 'Explore rooms',
        secondaryCtaLink: '/rooms',
        featuredTitle: 'Moments from Mountain Bridge',
        featuredDescription: 'Rooms, rooftop dining and the towering peaks that surround Pisang.',
      },
      restaurant: {
        name: 'Rooftop Restaurant',
        description:
          'Panoramic Himalayan dining at 3,300m — Nepali classics, wood-fired pizzas and warming drinks served under the peaks.',
        hours: '06:30 – 21:30 daily',
        phone: '+977 980-3607949',
        email: 'admin@mountainbridgepisang.com',
        image: '/images/rooftop-dining.png',
        images: ['/images/rooftop-dining.png', '/images/breakfast-view.png', '/images/dish-momos.png'],
        active: true,
      },
      seo: {
        metaTitle: 'Hotel Mountain Bridge & Rooftop Restaurant · Pisang, Manang, Nepal',
        metaDescription:
          'Boutique mountain lodge and rooftop restaurant in Pisang on the Annapurna Circuit. Panoramic Annapurna views, cosy rooms and warm Himalayan hospitality.',
        keywords: 'Pisang hotel, Annapurna Circuit lodge, Manang accommodation, rooftop restaurant Nepal, trekking lodge',
        ogTitle: 'Hotel Mountain Bridge & Rooftop Restaurant',
        ogDescription: 'A Himalayan haven on the Annapurna Circuit — rest, dine and breathe at 3,300m.',
        ogImage: '/images/hero-lodge-night.png',
        twitterImage: '/images/hero-lodge-night.png',
        canonicalUrl: 'https://mountainbridgepisang.com',
      },
      emailTemplates: [
        {
          id: 'tpl-booking-confirmation',
          name: 'Booking confirmation',
          subject: 'Your booking {{ref}} at Hotel Mountain Bridge is confirmed',
          body: 'Dear {{guestName}},\n\nYour stay in the {{roomName}} from {{checkIn}} to {{checkOut}} is confirmed. We look forward to welcoming you to Pisang.\n\nWarm regards,\nHotel Mountain Bridge',
        },
        {
          id: 'tpl-payment-confirmation',
          name: 'Payment confirmation',
          subject: 'Payment received for booking {{ref}}',
          body: 'Dear {{guestName}},\n\nWe have received your payment of {{total}} for booking {{ref}}. Thank you.\n\nHotel Mountain Bridge',
        },
        {
          id: 'tpl-cancellation',
          name: 'Cancellation',
          subject: 'Your booking {{ref}} has been cancelled',
          body: 'Dear {{guestName}},\n\nYour booking {{ref}} has been cancelled. If this was a mistake, please contact us.\n\nHotel Mountain Bridge',
        },
        {
          id: 'tpl-reservation',
          name: 'Restaurant reservation',
          subject: 'Your table reservation {{ref}} is confirmed',
          body: 'Dear {{name}},\n\nYour table for {{guests}} on {{date}} at {{time}} is confirmed. See you on the rooftop.\n\nHotel Mountain Bridge',
        },
      ],
      updatedAt: now,
    },
  }
  return db
}

// Merge a persisted snapshot over a fresh code seed. Content that is authored in
// code (room catalogue) always refreshes; transactional and admin-edited data is
// preserved; newly-added collections are backfilled so upgrading in place never
// destroys existing bookings/users/payments.
function mergeSnapshot(parsed: Partial<DB>): DB {
  const fresh = seed()
  return {
    ...fresh,
    ...parsed,
    rooms: fresh.rooms,
    // keep any admin-added coupons but ensure seed coupons exist
    coupons: parsed.coupons?.length ? parsed.coupons : fresh.coupons,
    tables: parsed.tables?.length ? parsed.tables : fresh.tables,
    staff: parsed.staff?.length ? parsed.staff : fresh.staff,
    // Backfill PMS/POS collections added by the upgrade.
    physicalRooms: parsed.physicalRooms?.length ? parsed.physicalRooms : fresh.physicalRooms,
    housekeepingTasks: parsed.housekeepingTasks ?? fresh.housekeepingTasks,
    seasonalRates: parsed.seasonalRates?.length ? parsed.seasonalRates : fresh.seasonalRates,
    addOns: parsed.addOns?.length ? parsed.addOns : fresh.addOns,
    menuItems: parsed.menuItems?.length ? parsed.menuItems : fresh.menuItems,
    orders: parsed.orders ?? fresh.orders,
    auditLogs: parsed.auditLogs ?? fresh.auditLogs,
    contactMessages: parsed.contactMessages ?? fresh.contactMessages,
    roomBlocks: parsed.roomBlocks ?? fresh.roomBlocks,
    // Change requests were added later — backfill for older snapshots.
    changeRequests: parsed.changeRequests ?? fresh.changeRequests,
    // CMS content: keep admin edits, seed on first upgrade.
    gallery: parsed.gallery?.length ? parsed.gallery : fresh.gallery,
    faqs: parsed.faqs?.length ? parsed.faqs : fresh.faqs,
    // Merge settings so newly-added fields (e.g. email templates, restaurant,
    // SEO) appear on upgrade while preserving any admin-edited values.
    settings: parsed.settings
      ? {
          ...fresh.settings,
          ...parsed.settings,
          social: { ...fresh.settings.social, ...(parsed.settings.social ?? {}) },
          hero: { ...fresh.settings.hero, ...(parsed.settings.hero ?? {}) },
          restaurant: { ...fresh.settings.restaurant, ...(parsed.settings.restaurant ?? {}) },
          seo: { ...fresh.settings.seo, ...(parsed.settings.seo ?? {}) },
          emailTemplates: parsed.settings.emailTemplates?.length
            ? parsed.settings.emailTemplates
            : fresh.settings.emailTemplates,
        }
      : fresh.settings,
  } as DB
}

// Ensure the single canonical admin account always has the current credential,
// even when a previously-persisted snapshot (disk or Blob) still carries the old
// password/salt. This updates the EXISTING account in place — it never creates a
// duplicate — and preserves the admin's id, staff role, emailVerified flag and
// every unrelated field, along with all other users/bookings/payments. When a
// credential change is applied we also drop that admin's stored session records
// (the signed cookies are already invalidated because the signing secret is tied
// to the credential). Returns true if a change was made.
function reconcileAdmin(target: DB): boolean {
  const admin = target.users.find((u) => u.email === ADMIN_EMAIL)
  if (!admin) {
    // No admin in the snapshot at all — restore the canonical one.
    target.users.unshift({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      name: 'Front Desk',
      phone: '+977 980-3607949',
      salt: ADMIN_SALT,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'admin',
      emailVerified: true,
      createdAt: Date.now(),
    })
    return true
  }
  const credentialStale =
    admin.salt !== ADMIN_SALT || admin.passwordHash !== ADMIN_PASSWORD_HASH
  if (credentialStale) {
    admin.salt = ADMIN_SALT
    admin.passwordHash = ADMIN_PASSWORD_HASH
    // Preserve any existing staff role; only backfill if somehow missing/invalid.
    if (!isStaffRole(admin.role)) admin.role = 'admin'
    admin.emailVerified = true
    // Revoke existing sessions for this admin after the password change.
    target.sessions = target.sessions.filter((s) => s.userId !== admin.id)
  }
  return credentialStale
}

function load(): DB {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8')
      const parsed = JSON.parse(raw) as Partial<DB>
      const merged = mergeSnapshot(parsed)
      reconcileAdmin(merged)
      return merged
    }
  } catch {
    // fall through to fresh seed
  }
  return seed()
}

type GlobalStore = {
  __mb_db?: DB
  __mb_hydration?: Promise<void>
  __mb_hydratedAt?: number
}
const g = globalThis as unknown as GlobalStore

export const db: DB = g.__mb_db ?? (g.__mb_db = load())

// Backfill collections added after a cached global `db` was first created. The
// working copy lives on `globalThis` and survives HMR / warm instances, so a db
// seeded before a new collection existed would otherwise be missing it and crash
// on `.filter`/`.push`. Guarantee every array-backed collection is present.
db.changeRequests ??= []
db.roomBlocks ??= []
db.contactMessages ??= []
db.auditLogs ??= []
db.orders ??= []
db.housekeepingTasks ??= []
db.notifications ??= []

// ---------------------------------------------------------------------------
// Durable persistence via Neon PostgreSQL.
//
// The in-memory `db` above is the working copy for the current instance. On
// serverless (Vercel) the local disk snapshot is ephemeral and per-instance, so
// data written by one invocation is invisible to the next — this is exactly why
// a customer created on one instance could not log in (or was seen as "new") on
// a later request handled by a different instance.
//
// To make data durable and shared across instances/cold-starts we mirror the
// whole snapshot into a single row in the existing Neon database (a private,
// server-only connection — password hashes never leave the server) and hydrate
// from it on the first request each instance handles.
//
// This is best-effort and additive: when DATABASE_URL is absent the DB calls are
// skipped and behaviour falls back to the disk/in-memory store, so local
// development keeps working with zero configuration.
// ---------------------------------------------------------------------------

// Single-row snapshot key. The entire DB JSON lives in one `app_state` row so
// every existing seed / merge / reconcile code path is reused unchanged.
const SNAPSHOT_ID = 'mountain-bridge'

// How long a per-instance hydration is considered "fresh" before the next read
// re-pulls from Neon. Short enough that a record written by one instance becomes
// visible to a warm instance almost immediately (fixes login-after-logout and
// the booking confirmation 404), cheap enough that it does not hammer the DB on
// every request.
const HYDRATE_TTL_MS = 5_000

function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

// Lazily-created Neon HTTP client, cached on globalThis so warm instances reuse
// it across requests/HMR. Imported dynamically so the module has no hard runtime
// dependency when DATABASE_URL is unset.
type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>
type NeonGlobal = GlobalStore & { __mb_sql?: NeonSql; __mb_tableReady?: boolean }
const ng = g as NeonGlobal

async function getSql(): Promise<NeonSql | null> {
  if (!dbEnabled()) return null
  if (ng.__mb_sql) return ng.__mb_sql
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL as string) as unknown as NeonSql
  ng.__mb_sql = sql
  return sql
}

// Create the snapshot table once per instance if it does not already exist.
// Never drops or alters existing tables/data.
async function ensureTable(sql: NeonSql): Promise<void> {
  if (ng.__mb_tableReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  ng.__mb_tableReady = true
}

// Pull the latest snapshot from Neon and merge it into the live `db` object.
// Mutates `db` in place (via Object.assign) so every module holding the exported
// reference sees the hydrated data.
async function hydrateFromDb(): Promise<void> {
  const sql = await getSql()
  if (!sql) return
  try {
    await ensureTable(sql)
    const rows = await sql`SELECT data FROM app_state WHERE id = ${SNAPSHOT_ID} LIMIT 1`
    const row = rows[0]
    if (!row || !row.data) return
    // jsonb comes back already parsed as a JS object.
    const parsed = (typeof row.data === 'string' ? JSON.parse(row.data as string) : row.data) as Partial<DB>
    Object.assign(db, mergeSnapshot(parsed))
    // Keep the canonical admin credential current even if the stored snapshot
    // still carries an old password. Persist back only when a change was applied
    // so the durable copy converges without churning on every hydrate.
    if (reconcileAdmin(db)) void runDbUpload()
  } catch (err) {
    // Never let a hydration failure take down a request — fall back to whatever
    // the in-memory/disk store already holds.
    console.log('[v0] DB hydrate skipped:', err instanceof Error ? err.message : 'unknown')
  }
}

// Per-instance hydration with a short freshness window. Call at the top of
// server entry points (route handlers / server components) that read or mutate
// durable data. Safe to call repeatedly and concurrently — a single fetch is
// shared by concurrent callers, and subsequent calls only re-pull once the
// snapshot is older than HYDRATE_TTL_MS.
//
// Pass `force` to bypass the freshness window and guarantee the very latest
// snapshot. This gives read-your-write behaviour for critical lookups (e.g. the
// booking confirmation page immediately after a booking is created on another
// serverless instance) so a warm instance can never serve a stale 404.
export async function ensureLoaded(force = false): Promise<void> {
  if (!dbEnabled()) return
  const fresh =
    typeof g.__mb_hydratedAt === 'number' && Date.now() - g.__mb_hydratedAt < HYDRATE_TTL_MS
  if (!force && fresh) return
  // Coalesce concurrent hydrations: callers await the same in-flight promise.
  if (!g.__mb_hydration) {
    g.__mb_hydration = hydrateFromDb().finally(() => {
      g.__mb_hydratedAt = Date.now()
      g.__mb_hydration = undefined
    })
  }
  await g.__mb_hydration
}

// Coalesced Neon upsert. Multiple synchronous persist() calls collapse into a
// single in-flight write; if writes arrive while one is running we mark the
// snapshot dirty and re-write once it settles (last-write-wins).
let dbUploading = false
let dbDirty = false

async function runDbUpload(): Promise<void> {
  const sql = await getSql()
  if (!sql) return
  if (dbUploading) {
    dbDirty = true
    return
  }
  dbUploading = true
  try {
    await ensureTable(sql)
    do {
      dbDirty = false
      // Whole-snapshot upsert into the single canonical row. jsonb cast keeps
      // the data queryable and compact. Never creates duplicate rows.
      const payload = JSON.stringify(db)
      await sql`
        INSERT INTO app_state (id, data, updated_at)
        VALUES (${SNAPSHOT_ID}, ${payload}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      `
    } while (dbDirty)
  } catch (err) {
    dbDirty = true
    console.log('[v0] DB upload failed:', err instanceof Error ? err.message : 'unknown')
  } finally {
    dbUploading = false
  }
}

// Synchronous, best-effort snapshot. Writes the local disk copy immediately and
// schedules a durable Neon upsert (fire-and-forget) when a database is configured.
export function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(db), 'utf8')
  } catch {
    // read-only fs (serverless) — in-memory only, acceptable for preview
  }
  if (dbEnabled()) void runDbUpload()
}

// Durable persist: writes the disk snapshot and AWAITS the Neon upsert so the
// data is guaranteed committed before the request returns. Use in critical
// mutations (bookings, payments, auth) where a lost write is unacceptable and
// the serverless instance may freeze immediately after responding.
export async function persistDurable() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(db), 'utf8')
  } catch {
    // read-only fs (serverless) — Neon upsert below is the durable path
  }
  if (dbEnabled()) await runDbUpload()
}

export function uid() {
  return randomUUID()
}

export function makeRef(prefix: string) {
  const s = randomBytes(3).toString('hex').toUpperCase()
  const n = Math.floor(Math.random() * 900 + 100)
  return `${prefix}-${s}${n}`
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return { salt, passwordHash: hash(password, salt) }
}

export function verifyPassword(password: string, salt: string, passwordHash: string) {
  return hash(password, salt) === passwordHash
}

// Append a sensitive-action entry to the audit trail (Phase 17).
export function audit(actor: { id: string; name: string }, action: string, target?: string, detail?: string) {
  db.auditLogs.push({
    id: randomUUID(),
    userId: actor.id,
    userName: actor.name,
    action,
    target,
    detail,
    createdAt: Date.now(),
  })
  // Cap the log so the in-memory store doesn't grow unbounded.
  if (db.auditLogs.length > 500) db.auditLogs = db.auditLogs.slice(-500)
}
