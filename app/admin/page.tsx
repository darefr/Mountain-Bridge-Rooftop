import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { isStaffRole } from '@/lib/db/types'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin Dashboard | Hotel Mountain Bridge',
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  if (!isStaffRole(user.role)) redirect('/account')
  return <AdminDashboard userName={user.name} />
}
