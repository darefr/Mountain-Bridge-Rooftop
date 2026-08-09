import { db } from '@/lib/db/store'
import type { RestaurantTable } from '@/lib/db/types'
import { ALL_SLOTS, MAX_PARTY_SIZE, slotsOverlap } from '@/lib/restaurant-slots'

// ---------------------------------------------------------------------------
// Restaurant reservation engine — real table capacity + overlap prevention.
// A reservation occupies a physical table for a seating window; two
// reservations on the same table whose windows overlap are not allowed.
// ---------------------------------------------------------------------------

export { MAX_PARTY_SIZE }

// Tables already committed (overlapping window) for a given date/time.
function busyTableIds(date: string, time: string, ignoreId?: string): Set<string> {
  const ids = new Set<string>()
  for (const r of db.reservations) {
    if (r.id === ignoreId) continue
    if (r.status === 'cancelled') continue
    if (r.date !== date) continue
    if (!r.tableId) continue
    if (slotsOverlap(r.time, time)) ids.add(r.tableId)
  }
  return ids
}

// Pick the smallest suitable free table for a party (best-fit), so large
// tables stay open for large parties. Returns null when fully booked.
export function findTableFor(
  date: string,
  time: string,
  guests: number,
  ignoreId?: string,
): RestaurantTable | null {
  const busy = busyTableIds(date, time, ignoreId)
  const candidates = db.tables
    .filter((t) => t.seats >= guests && !busy.has(t.id))
    .sort((a, b) => a.seats - b.seats || a.name.localeCompare(b.name))
  return candidates[0] ?? null
}

export function largestTableSeats(): number {
  return db.tables.reduce((max, t) => Math.max(max, t.seats), 0)
}

// Which of the standard slots still have a suitable free table for a party.
export function availableSlots(date: string, guests: number): string[] {
  return ALL_SLOTS.filter((time) => findTableFor(date, time, guests) !== null)
}
