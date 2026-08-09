import { db, persist, uid } from '@/lib/db/store'
import type { Notification } from '@/lib/db/types'
import { isStaffRole } from '@/lib/db/types'

// Broadcast an operational notification to every staff/admin account so it
// surfaces in the admin Notification Center (Phase 4).
export function notifyStaff(
  title: string,
  body: string,
  type: Notification['type'] = 'system',
) {
  const now = Date.now()
  const staff = db.users.filter((u) => isStaffRole(u.role))
  for (const u of staff) {
    db.notifications.unshift({
      id: uid(),
      userId: u.id,
      title,
      body,
      type,
      read: false,
      createdAt: now,
    })
  }
  // Cap notifications to avoid unbounded growth in the in-memory store.
  if (db.notifications.length > 1000) db.notifications = db.notifications.slice(0, 1000)
  persist()
}

export function notify(
  userId: string,
  title: string,
  body: string,
  type: Notification['type'] = 'system',
) {
  const n: Notification = {
    id: uid(),
    userId,
    title,
    body,
    type,
    read: false,
    createdAt: Date.now(),
  }
  db.notifications.unshift(n)
  persist()
  return n
}

export function userNotifications(userId: string) {
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
}
