// Pure, client-safe restaurant seating constants (no server/db imports).
// Shared by the server engine (lib/restaurant.ts) and the client form.

// How long a table is held per reservation (minutes).
export const SEATING_DURATION_MIN = 90

export const MAX_PARTY_SIZE = 12

// Bookable seating slots, grouped by service. Kept in sync with the rooftop
// restaurant's opening hours (breakfast 06:30, all-day dining until 21:30).
export const SLOT_GROUPS: { label: string; times: string[] }[] = [
  { label: 'Breakfast', times: ['07:00', '07:30', '08:00', '08:30', '09:00'] },
  { label: 'Lunch', times: ['12:00', '12:30', '13:00', '13:30', '14:00'] },
  { label: 'Dinner', times: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] },
]

export const ALL_SLOTS = SLOT_GROUPS.flatMap((g) => g.times)

export function slotToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Two seating windows overlap when each starts before the other ends.
export function slotsOverlap(aStart: string, bStart: string): boolean {
  const a = slotToMinutes(aStart)
  const b = slotToMinutes(bStart)
  return a < b + SEATING_DURATION_MIN && b < a + SEATING_DURATION_MIN
}
