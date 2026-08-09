import 'server-only'
import { db } from '@/lib/db/store'
import { site as siteDefaults } from '@/lib/site'
import type { SiteSettings, GalleryItem, FaqItem } from '@/lib/db/types'

// Single source of truth for public content. Reads the live settings/content
// from the store so admin edits appear on the public website immediately.
// Falls back to the static defaults in lib/site.ts where a value is empty.

export function getSettings(): SiteSettings {
  return db.settings
}

// A merged view used by header/footer/hero so components have one clean shape.
export function getSiteContent() {
  const s = db.settings
  return {
    name: s.shortName || siteDefaults.name,
    fullName: s.hotelName || siteDefaults.fullName,
    tagline: s.tagline || siteDefaults.tagline,
    description: s.description || '',
    footerText: s.footerText || '',
    phone: s.phone || siteDefaults.phone,
    phoneHref: `tel:${(s.phone || siteDefaults.phone).replace(/[^\d+]/g, '')}`,
    whatsapp: s.whatsapp
      ? `https://wa.me/${s.whatsapp.replace(/[^\d]/g, '')}`
      : siteDefaults.whatsapp,
    email: s.email || siteDefaults.email,
    address: s.address || siteDefaults.location,
    mapsUrl: s.mapsLink || siteDefaults.mapsUrl,
    websiteUrl: s.websiteUrl || '',
    checkInTime: s.checkInTime,
    checkOutTime: s.checkOutTime,
    restaurantHours: s.restaurantHours,
    currency: s.currency,
    social: {
      facebook: s.social?.facebook || '',
      instagram: s.social?.instagram || '',
      tripadvisor: s.social?.tripadvisor || '',
      youtube: s.social?.youtube || '',
    },
    hero: s.hero,
    restaurant: s.restaurant,
    seo: s.seo,
    altitude: siteDefaults.altitude,
    rating: siteDefaults.rating,
    reviewsCount: siteDefaults.reviewsCount,
    mapsEmbed: siteDefaults.mapsEmbed,
  }
}

export type SiteContent = ReturnType<typeof getSiteContent>

// Public gallery: enabled items only, ordered, featured first within order.
export function getPublicGallery(): GalleryItem[] {
  return [...db.gallery]
    .filter((g) => g.enabled)
    .sort((a, b) => a.order - b.order)
}

// Distinct categories present in the enabled gallery (for public filters).
export function getGalleryCategories(): string[] {
  const cats = new Set<string>()
  for (const g of db.gallery) if (g.enabled) cats.add(g.category)
  return Array.from(cats)
}

// Public FAQs: active only, ordered.
export function getPublicFaqs(): FaqItem[] {
  return [...db.faqs].filter((f) => f.active).sort((a, b) => a.order - b.order)
}

// FAQs grouped by category for the public page layout.
export function getPublicFaqGroups(): { category: string; items: FaqItem[] }[] {
  const groups: Record<string, FaqItem[]> = {}
  for (const f of getPublicFaqs()) {
    ;(groups[f.category] ??= []).push(f)
  }
  return Object.entries(groups).map(([category, items]) => ({ category, items }))
}
