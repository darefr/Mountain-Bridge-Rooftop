// Central domain types for Hotel Mountain Bridge backend.
// The store is swappable: today it is an in-process singleton (seeded from
// lib/data.ts) with best-effort disk persistence; a Neon/Postgres adapter can
// implement the same shapes later without touching feature code.

// Granular RBAC roles. 'staff' and 'admin' are kept for backward compatibility
// with existing sessions/data; the new roles allow per-department access control.
export type Role =
  | 'customer'
  | 'staff'
  | 'admin'
  | 'super_admin'
  | 'manager'
  | 'front_desk'
  | 'housekeeping'
  | 'restaurant'
  | 'chef'
  | 'accountant'

// Roles that may access the admin/staff back office at all.
export const STAFF_ROLES: Role[] = [
  'staff',
  'admin',
  'super_admin',
  'manager',
  'front_desk',
  'housekeeping',
  'restaurant',
  'chef',
  'accountant',
]

export function isStaffRole(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

// Roles with full management privileges (finance, staff, settings).
export function isManagerRole(role: Role | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'manager'
}

// Notification channel preferences for a customer account.
export type NotificationPrefs = {
  bookingEmails: boolean // booking confirmations, status changes
  reservationEmails: boolean // restaurant reservation updates
  promoEmails: boolean // offers & marketing
}

export const defaultNotificationPrefs: NotificationPrefs = {
  bookingEmails: true,
  reservationEmails: true,
  promoEmails: false,
}

// Preferred UI language for a logged-in account (persists across devices).
export type PreferredLanguage = 'en' | 'ne'
export type PreferredCurrency = 'USD' | 'NPR'

// Optional emergency contact stored on the customer profile.
export type EmergencyContact = {
  name?: string
  phone?: string
  relation?: string
}

// A saved room / offer / experience in the customer's wishlist.
export type WishlistKind = 'room' | 'offer' | 'experience'

export type WishlistItem = {
  id: string // stable id for the saved entry
  kind: WishlistKind
  refId: string // room slug / offer id / experience key
  title: string
  image?: string
  href?: string
  meta?: string // small caption (e.g. price)
  addedAt: number
}

// A hashed, expiring, one-time challenge (email verification / password reset).
// The raw 6-digit code is NEVER stored — only a salted scrypt hash of it.
export type CodeChallenge = {
  codeHash: string
  salt: string
  expiresAt: number // epoch ms
  attempts: number // failed verification attempts so far
  maxAttempts: number
  resendCount: number // how many times a fresh code was sent
  lastSentAt: number // epoch ms of the most recent send (for resend cooldown)
}

export type User = {
  id: string
  email: string
  name: string
  phone?: string
  image?: string // profile photo (data URL or hosted path)
  passwordHash: string
  salt: string
  role: Role
  emailVerified: boolean
  notifyPrefs?: NotificationPrefs
  // Extended customer profile (all optional; backfilled for older records).
  country?: string
  preferredLanguage?: PreferredLanguage
  preferredCurrency?: PreferredCurrency
  emergencyContact?: EmergencyContact
  wishlist?: WishlistItem[]
  // Active challenges. Generating a new one replaces the old (auto-invalidate).
  emailChallenge?: CodeChallenge
  resetChallenge?: CodeChallenge
  // Legacy link-token fields kept optional for backward-compatible data.
  verifyToken?: string
  resetToken?: string
  resetExpires?: number
  createdAt: number
}

export type Session = {
  token: string
  userId: string
  expires: number
  createdAt?: number
  userAgent?: string
  ip?: string
}

// A room CATEGORY (type). Physical inventory lives in PhysicalRoom below.
export type RoomUnit = {
  slug: string
  name: string
  image: string
  priceUSD: number
  totalUnits: number
  maxGuests: number
  // Optional seasonal / rate rules used by the booking engine.
  weekendSurchargePct?: number
  extraGuestFeeUSD?: number
  extraBedFeeUSD?: number
  minNights?: number
  maxNights?: number
  // Content / management fields (Phase 4). Optional & backfilled for older data.
  description?: string
  amenities?: string[]
  active?: boolean
}

// Operational status of a single physical room/unit (PMS).
export type RoomOpStatus =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'out_of_service'

export type HousekeepingState = 'clean' | 'dirty' | 'inspected'

// An individual, physical room with its own number and live status.
export type PhysicalRoom = {
  id: string
  number: string // e.g. "101"
  roomSlug: string // category slug
  floor: number
  status: RoomOpStatus
  housekeeping: HousekeepingState
  currentBookingId?: string
  assignedStaffId?: string
  notes?: string
  updatedAt: number
}

export type HousekeepingPriority = 'low' | 'normal' | 'high'
export type HousekeepingTaskStatus = 'pending' | 'in_progress' | 'completed'

export type HousekeepingTask = {
  id: string
  roomNumber: string
  type: 'cleaning' | 'maintenance'
  priority: HousekeepingPriority
  status: HousekeepingTaskStatus
  assignedStaffId?: string
  note?: string
  createdAt: number
  completedAt?: number
}

// A seasonal date-range price rule (multiplier on the base nightly rate).
export type SeasonalRate = {
  id: string
  name: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  multiplier: number // e.g. 1.25 for peak season
  roomSlug?: string // undefined = applies to all categories
  active: boolean
}

// A bookable add-on / package extra.
export type AddOn = {
  id: string
  name: string
  priceUSD: number
  perNight: boolean
  active: boolean
  description?: string
}

// Add-on selected on a booking.
export type BookingAddOn = {
  addOnId: string
  name: string
  priceUSD: number
  qty: number
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'completed'
  | 'cancelled'
  | 'no_show'
export type PaymentStatus = 'unpaid' | 'pending' | 'partial' | 'paid' | 'failed' | 'refunded'
export type BookingSource = 'online' | 'walk_in' | 'phone' | 'admin'

export type Booking = {
  id: string
  ref: string
  userId?: string
  roomSlug: string
  roomName: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  nights: number
  rooms: number
  guests: number
  currency: 'USD' | 'NPR'
  subtotal: number
  tax: number
  service?: number
  discount: number
  total: number
  couponCode?: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  createdAt: number
  // --- PMS / operations (all optional; backfilled for older records) ---
  source?: BookingSource
  roomNumbers?: string[] // assigned physical rooms
  checkedInAt?: number
  checkedOutAt?: number
  guestNotes?: string // notes from/about the guest
  staffNotes?: string // internal staff notes
  specialRequests?: string
  extraBeds?: number
  addOns?: BookingAddOn[]
  // --- Finance ---
  amountPaid?: number
  refundAmount?: number
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type Reservation = {
  id: string
  ref: string
  userId?: string
  date: string
  time: string
  guests: number
  name: string
  phone: string
  email?: string
  requests?: string
  tableId?: string
  status: ReservationStatus
  createdAt: number
}

export type Payment = {
  id: string
  bookingId: string
  provider: 'esewa' | 'khalti' | 'fonepay'
  amount: number
  currency: 'NPR'
  status: PaymentStatus
  providerRef?: string
  transactionUuid: string
  verifiedAt?: number
  createdAt: number
}

export type Coupon = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  minNights?: number
  minBookingValueUSD?: number
  expires?: string
  usageLimit?: number
  usageCount?: number
  description?: string
}

export type Notification = {
  id: string
  userId: string
  title: string
  body: string
  type: 'booking' | 'payment' | 'reservation' | 'system'
  read: boolean
  createdAt: number
}

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'cleaning'

export type RestaurantTable = {
  id: string
  name: string
  seats: number
  location: string
  status?: TableStatus
}

export type StaffMember = {
  id: string
  name: string
  role: string // display role label; RBAC uses User.role
  email: string
  phone?: string
  userId?: string // linked login account, if any
  active?: boolean
}

// --- Restaurant POS ---
export type MenuItemRecord = {
  id: string
  category: string
  name: string
  desc: string
  priceUSD: number
  image?: string
  vegetarian: boolean
  available: boolean
  featured: boolean
  offer?: string
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled'

export type OrderLine = {
  itemId: string
  name: string
  priceUSD: number
  qty: number
  note?: string
}

export type RestaurantOrder = {
  id: string
  ref: string
  tableId?: string
  tableName?: string
  guestName?: string
  items: OrderLine[]
  subtotal: number
  tax: number
  total: number
  currency: 'USD' | 'NPR'
  status: OrderStatus
  note?: string
  createdAt: number
  updatedAt: number
}

// --- Audit log for sensitive admin actions ---
export type AuditLog = {
  id: string
  userId: string
  userName: string
  action: string
  target?: string
  detail?: string
  createdAt: number
}

export type ReviewRecord = {
  id: string
  userId?: string
  email?: string
  name: string
  country: string
  text: string
  rating: number
  trip: string
  approved: boolean
  featured?: boolean
  createdAt: number
}

export type OfferRecord = {
  id: string
  title: string
  tag: string
  image: string
  desc: string
  includes: string[]
  price: string
  active: boolean
}

// --- Contact form submissions (Phase 4: contact message management) ---
export type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  status: ContactStatus
  createdAt: number
  repliedAt?: number
  handledBy?: string
}

// --- Manual inventory blocks (Phase 4: availability management) ---
export type RoomBlockReason = 'maintenance' | 'private_booking' | 'closure' | 'other'

export type RoomBlock = {
  id: string
  roomSlug: string
  units: number
  start: string // YYYY-MM-DD (inclusive)
  end: string // YYYY-MM-DD (exclusive checkout-style)
  reason: RoomBlockReason
  note?: string
  createdBy?: string
  createdAt: number
}

// --- Booking change requests (customer-initiated modifications) ---
export type ChangeRequestType = 'dates' | 'room' | 'guests' | 'other'
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// A customer's request to modify an existing booking. The original booking is
// never mutated until an admin approves; this keeps a full audit trail of what
// was requested, by whom, and how it was resolved.
export type BookingChangeRequest = {
  id: string
  bookingId: string
  bookingRef: string
  userId?: string
  type: ChangeRequestType
  // Requested new values (populated depending on `type`).
  checkIn?: string
  checkOut?: string
  roomSlug?: string
  roomName?: string
  guests?: number
  // Snapshot of the original values at request time (for admin review + audit).
  fromCheckIn?: string
  fromCheckOut?: string
  fromRoomSlug?: string
  fromRoomName?: string
  fromGuests?: number
  message?: string
  status: ChangeRequestStatus
  adminNote?: string
  createdAt: number
  resolvedAt?: number
  resolvedBy?: string
}

// --- Editable email templates (Phase 4: safe email template management) ---
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

// --- Gallery management (CMS) ---
export type GalleryCategory =
  | 'Rooms'
  | 'Restaurant'
  | 'Rooftop'
  | 'Hotel'
  | 'Mountain'
  | 'Exterior'
  | 'Interior'
  | 'Trekking'
  | 'Events'
  | 'Experiences'
  | 'Other'

export type GalleryItem = {
  id: string
  src: string // image path or data URL
  title?: string
  description?: string
  alt: string
  category: GalleryCategory
  featured: boolean
  enabled: boolean
  order: number
  createdAt: number
}

// --- FAQ management (CMS) ---
export type FaqItem = {
  id: string
  question: string
  answer: string
  category: string
  active: boolean
  order: number
  createdAt: number
}

// --- Restaurant content (CMS) ---
export type RestaurantSettings = {
  name: string
  description: string
  hours: string
  phone: string
  email: string
  image: string // featured image (path or data URL)
  images: string[]
  active: boolean
}

// --- SEO settings (CMS) ---
export type SeoSettings = {
  metaTitle: string
  metaDescription: string
  keywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterImage: string
  canonicalUrl: string
}

// --- Site / hotel content settings (Phase 4: lightweight CMS) ---
export type SiteSettings = {
  hotelName: string
  shortName: string
  websiteTitle: string
  tagline: string
  description: string
  phone: string
  email: string
  address: string
  whatsapp: string
  mapsLink: string
  websiteUrl: string
  checkInTime: string
  checkOutTime: string
  restaurantHours: string
  currency: 'USD' | 'NPR'
  taxRatePct: number
  footerText: string
  social: {
    facebook?: string
    instagram?: string
    tripadvisor?: string
    youtube?: string
  }
  hero: {
    title: string
    subtitle: string
    description?: string
    image?: string
    video?: string
    ctaText?: string
    ctaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    featuredTitle?: string
    featuredDescription?: string
  }
  restaurant: RestaurantSettings
  seo: SeoSettings
  emailTemplates: EmailTemplate[]
  updatedAt?: number
}

export type DB = {
  users: User[]
  sessions: Session[]
  rooms: RoomUnit[]
  physicalRooms: PhysicalRoom[]
  bookings: Booking[]
  reservations: Reservation[]
  payments: Payment[]
  coupons: Coupon[]
  notifications: Notification[]
  tables: RestaurantTable[]
  staff: StaffMember[]
  reviews: ReviewRecord[]
  offers: OfferRecord[]
  housekeepingTasks: HousekeepingTask[]
  seasonalRates: SeasonalRate[]
  addOns: AddOn[]
  menuItems: MenuItemRecord[]
  orders: RestaurantOrder[]
  auditLogs: AuditLog[]
  contactMessages: ContactMessage[]
  roomBlocks: RoomBlock[]
  changeRequests: BookingChangeRequest[]
  gallery: GalleryItem[]
  faqs: FaqItem[]
  settings: SiteSettings
}

export type PublicUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'phone'
  | 'image'
  | 'role'
  | 'emailVerified'
  | 'notifyPrefs'
  | 'country'
  | 'preferredLanguage'
  | 'preferredCurrency'
  | 'emergencyContact'
  | 'wishlist'
  | 'createdAt'
>
