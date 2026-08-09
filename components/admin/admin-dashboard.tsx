'use client'

import { useState, lazy, Suspense } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  LayoutDashboard,
  CalendarCheck,
  UtensilsCrossed,
  BedDouble,
  Users,
  UserCog,
  CreditCard,
  Star,
  Tag,
  Ticket,
  Bell,
  BarChart3,
  Home,
  Check,
  X,
  Loader2,
  Plus,
  ConciergeBell,
  Sparkles,
  LogIn,
  LogOut,
  Wrench,
  Percent,
  Download,
  TrendingUp,
  CalendarX2,
  Mail,
  ShieldCheck,
  Settings as SettingsIcon,
  Trash2,
  Image as ImageIconLucide,
  HelpCircle,
  Menu as MenuIcon,
  ClipboardList,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth/use-auth'
import { money, formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ContactMessages, AuditLog, Availability } from './sections-extra'
import { GalleryManager, FaqManager, SettingsCMS } from './content-sections'
import { ChangeRequestsManager } from './change-requests-manager'
import { ImageUpload } from './image-upload'

// Heavy sections (charts / large tables) are code-split so the initial admin
// bundle stays small and the dashboard loads fast.
const AnalyticsSection = lazy(() => import('./analytics-section').then((m) => ({ default: m.AnalyticsSection })))
const BookingsManager = lazy(() => import('./bookings-manager').then((m) => ({ default: m.BookingsManager })))

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Section =
  | 'overview' | 'analytics' | 'frontdesk' | 'housekeeping' | 'bookings' | 'changeRequests' | 'reservations' | 'rooms' | 'availability' | 'rates' | 'pos' | 'gallery' | 'faq' | 'customers'
  | 'staff' | 'payments' | 'reviews' | 'offers' | 'coupons' | 'messages' | 'notifications' | 'reports' | 'audit' | 'settings'

export function AdminDashboard({ userName }: { userName: string }) {
  const { t } = useI18n()
  const { logout } = useAuth()
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data, isLoading, mutate } = useSWR('/api/admin/data', fetcher, { refreshInterval: 15000 })

  async function act(action: string, id?: string, payload?: unknown) {
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, payload }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok && json?.error) {
      // Surface backend validation / permission errors instead of failing silently.
      if (typeof window !== 'undefined') window.alert(json.error)
    }
    mutate()
    return json
  }

  const isManager = data?.me?.role === 'admin' || data?.me?.role === 'super_admin' || data?.me?.role === 'manager'
  const unread = data?.stats?.unreadNotifications ?? 0
  const newMsgs = data?.stats?.newContactMessages ?? 0
  const pendingChanges = data?.stats?.pendingChangeRequests ?? 0

  type NavItem = { id: Section; label: string; icon: React.ElementType; badge?: number; managerOnly?: boolean }
  const nav: NavItem[] = ([
    { id: 'overview', label: t('admin.overview'), icon: LayoutDashboard },
    { id: 'analytics', label: t('admin.analytics'), icon: TrendingUp },
    { id: 'frontdesk', label: t('admin.frontDesk'), icon: ConciergeBell },
    { id: 'housekeeping', label: t('admin.housekeeping'), icon: Sparkles },
    { id: 'bookings', label: t('admin.bookings'), icon: CalendarCheck },
    { id: 'changeRequests', label: t('admin.changeRequests'), icon: ClipboardList, badge: pendingChanges },
    { id: 'reservations', label: t('admin.reservations'), icon: UtensilsCrossed },
    { id: 'rooms', label: t('admin.rooms'), icon: BedDouble },
    { id: 'availability', label: t('admin.availability'), icon: CalendarX2 },
    { id: 'rates', label: t('admin.ratesAddOns'), icon: Percent },
    { id: 'pos', label: t('admin.restaurantPos'), icon: UtensilsCrossed },
    { id: 'gallery', label: 'Gallery', icon: ImageIconLucide, managerOnly: true },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, managerOnly: true },
    { id: 'customers', label: t('admin.customers'), icon: Users },
    { id: 'staff', label: t('admin.staff'), icon: UserCog, managerOnly: true },
    { id: 'payments', label: t('admin.payments'), icon: CreditCard },
    { id: 'reviews', label: t('admin.reviews'), icon: Star },
    { id: 'offers', label: t('admin.offers'), icon: Tag },
    { id: 'coupons', label: t('admin.coupons'), icon: Ticket },
    { id: 'messages', label: t('admin.messages'), icon: Mail, badge: newMsgs },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell, badge: unread },
    { id: 'reports', label: t('admin.reports'), icon: BarChart3 },
    { id: 'audit', label: t('admin.audit'), icon: ShieldCheck, managerOnly: true },
    { id: 'settings', label: t('admin.settings'), icon: SettingsIcon, managerOnly: true },
  ] as NavItem[]).filter((n) => !n.managerOnly || isManager)

  const activeLabel = nav.find((n) => n.id === section)?.label ?? t('admin.title')

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col gap-1">
      {nav.map((n) => (
        <button
          key={n.id}
          onClick={() => { setSection(n.id); onNavigate?.() }}
          className={cn(
            'flex w-full shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm transition-colors',
            section === n.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
          )}
        >
          <n.icon className="size-4 shrink-0" />
          <span className="whitespace-nowrap">{n.label}</span>
          {!!n.badge && (
            <span className={cn('ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[0.65rem] font-semibold', section === n.id ? 'bg-primary-foreground/25 text-primary-foreground' : 'bg-primary text-primary-foreground')}>
              {n.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen pt-20 lg:pt-24">
      <div className="container-luxe pb-16">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-6">
          <div className="flex min-w-0 items-center gap-3">
            <AdminAvatarUpload image={data?.me?.image} name={userName} onSaved={() => mutate()} />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-2xl text-foreground sm:text-3xl">{t('admin.title')}</h1>
              <p className="truncate text-sm text-muted-foreground">{t('account.welcome')}, {userName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" className="glass hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm text-foreground sm:flex">
              <Home className="size-4" /> {t('admin.backToSite')}
            </Link>
            <Link href="/" className="glass grid size-10 place-items-center rounded-full text-foreground sm:hidden" aria-label={t('admin.backToSite')}>
              <Home className="size-4" />
            </Link>
            <button onClick={() => logout()} className="glass hidden rounded-full px-4 py-2 text-sm text-foreground sm:block">
              {t('admin.signOut')}
            </button>
            <button onClick={() => logout()} className="glass grid size-10 place-items-center rounded-full text-foreground sm:hidden" aria-label={t('admin.signOut')}>
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* Mobile section bar with hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="glass-strong mb-4 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 lg:hidden"
          aria-label="Open navigation menu"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MenuIcon className="size-5 text-primary" /> {activeLabel}
          </span>
          <span className="text-xs text-muted-foreground">Menu</span>
        </button>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* desktop sidebar */}
          <nav className="glass-strong hidden h-max rounded-3xl p-2 lg:sticky lg:top-24 lg:block">
            <NavList />
          </nav>

          {/* content */}
          <div className="min-w-0">
            {isLoading || !data ? (
              <div className="grid min-h-[40vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : data.error ? (
              <div className="glass rounded-3xl p-8 text-center text-muted-foreground">{t('admin.signInRequired')}</div>
            ) : (
              <SectionContent section={section} data={data} act={act} t={t} />
            )}
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="glass-strong absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col gap-2 overflow-y-auto rounded-r-3xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-serif text-lg text-foreground">{t('admin.title')}</span>
              <button onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-full bg-foreground/5 text-foreground" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}
    </div>
  )
}

// Admin profile photo — also used as the site-wide hotel logo. Reuses the
// shared ImageUpload (auto resize/compress) and the existing profile endpoint.
function AdminAvatarUpload({ image, name, onSaved }: { image?: string; name: string; onSaved: () => void }) {
  const { refresh } = useAuth()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | undefined>(image)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function save() {
    setBusy(true)
    setError('')
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: draft ?? '' }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(json.error || 'Could not save image.')
      return
    }
    await refresh() // updates header logo (uses useAuth) instantly
    onSaved() // re-fetch admin data so this avatar updates
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(image)
          setError('')
          setOpen(true)
        }}
        className="group relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 ring-1 ring-primary/30 transition-colors hover:ring-primary/60"
        aria-label="Change profile photo and site logo"
        title="Change profile photo & site logo"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image || '/placeholder.svg'} alt={name} className="size-full object-cover" />
        ) : (
          <span className="font-serif text-sm text-primary">{initials || 'MB'}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-background/55 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
          <ImageIconLucide className="size-4 text-foreground" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-strong relative w-full max-w-sm rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Profile photo & site logo</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-foreground/5 text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              This image appears on your admin profile and is used as the hotel logo across the site.
              Leave empty to keep the default logo.
            </p>
            <ImageUpload value={draft} onChange={(v) => setDraft(v || undefined)} aspect="square" />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="glass rounded-full px-4 py-2 text-sm text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function LazyFallback() {
  return <div className="grid min-h-[30vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
}

function SectionContent({ section, data, act, t }: { section: Section; data: any; act: (a: string, id?: string, p?: unknown) => Promise<any> | void; t: (k: string) => string }) {
  if (section === 'overview') return <Overview data={data} t={t} />
  if (section === 'analytics') return <Suspense fallback={<LazyFallback />}><AnalyticsSection /></Suspense>
  if (section === 'frontdesk') return <FrontDesk data={data} act={act} t={t} />
  if (section === 'housekeeping') return <Housekeeping data={data} act={act} t={t} />
  if (section === 'bookings') return <Suspense fallback={<LazyFallback />}><BookingsManager data={data} act={act} rooms={data.rooms} /></Suspense>
  if (section === 'changeRequests') return <ChangeRequestsManager data={data} act={act} />
  if (section === 'reservations') return <Reservations data={data} act={act} t={t} />
  if (section === 'rooms') return <Rooms data={data} act={act} t={t} />
  if (section === 'availability') return <Availability data={data} act={act} />
  if (section === 'rates') return <RatesAddOns data={data} act={act} t={t} />
  if (section === 'pos') return <RestaurantPOS data={data} act={act} t={t} />
  if (section === 'gallery') return <GalleryManager data={data} act={act} />
  if (section === 'faq') return <FaqManager data={data} act={act} />
  if (section === 'customers') return <Customers data={data} t={t} />
  if (section === 'staff') return <Staff data={data} act={act} t={t} />
  if (section === 'payments') return <Payments data={data} act={act} t={t} />
  if (section === 'reviews') return <Reviews data={data} act={act} t={t} />
  if (section === 'offers') return <Offers data={data} act={act} t={t} />
  if (section === 'coupons') return <Coupons data={data} act={act} t={t} />
  if (section === 'messages') return <ContactMessages data={data} act={act} />
  if (section === 'notifications') return <Notifications data={data} act={act} t={t} />
  if (section === 'reports') return <Reports data={data} t={t} />
  if (section === 'audit') return <AuditLog data={data} />
  if (section === 'settings') return <SettingsCMS data={data} act={act} />
  return null
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass-strong rounded-3xl p-5', className)}>{children}</div>
}

function Overview({ data, t }: { data: any; t: (k: string) => string }) {
  const s = data.stats
  const stats = [
    { label: t('admin.totalRevenue'), value: `$${s.revenue.toLocaleString()}` },
    { label: t('admin.monthlyRevenue'), value: `$${(s.monthlyRevenue ?? 0).toLocaleString()}` },
    { label: t('admin.totalBookings'), value: s.bookings },
    { label: t('admin.totalCustomers'), value: s.customers },
  ]
  const ops = [
    { label: t('admin.todayBookings'), value: s.todayBookings ?? 0, tone: 'text-primary' },
    { label: t('admin.arrivalsToday'), value: s.arrivalsToday ?? 0, tone: 'text-primary' },
    { label: t('admin.departuresToday'), value: s.departuresToday ?? 0, tone: 'text-primary' },
    { label: t('admin.occupancy'), value: `${s.occupancyRate ?? 0}%`, tone: 'text-foreground' },
    { label: t('admin.occupied'), value: s.occupiedRooms ?? 0, tone: 'text-foreground' },
    { label: t('admin.availableRooms'), value: s.availableRooms ?? 0, tone: 'text-success' },
    { label: t('admin.needCleaning'), value: s.cleaningRooms ?? 0, tone: 'text-amber-500' },
    { label: t('admin.pendingBookings'), value: s.pendingBookings ?? 0, tone: 'text-amber-500' },
    { label: t('admin.pendingPayments'), value: s.pendingPayments ?? 0, tone: 'text-destructive' },
    { label: t('admin.cancelledBookings'), value: s.cancelledBookings ?? 0, tone: 'text-destructive' },
    { label: t('admin.reservations'), value: s.reservations ?? 0, tone: 'text-foreground' },
    { label: t('admin.newCustomers'), value: s.newCustomers ?? 0, tone: 'text-success' },
    { label: t('admin.reviews'), value: s.reviews ?? 0, tone: 'text-foreground' },
    { label: t('admin.unread'), value: s.unreadNotifications ?? 0, tone: 'text-primary' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => (
          <Card key={st.label}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{st.label}</p>
            <p className="mt-2 font-serif text-3xl text-foreground">{st.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {ops.map((o) => (
          <Card key={o.label} className="p-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{o.label}</p>
            <p className={cn('mt-1 font-serif text-2xl', o.tone)}>{o.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-serif text-lg text-foreground">{t('admin.recentBookings')}</h3>
          <div className="space-y-2">
            {data.bookings.slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{b.ref} · {b.roomName}</span>
                <StatusPill status={b.status} />
              </div>
            ))}
            {!data.bookings.length && <Empty t={t} />}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 font-serif text-lg text-foreground">{t('admin.recentReservations')}</h3>
          <div className="space-y-2">
            {data.reservations.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{r.name} · {r.date} {r.time}</span>
                <StatusPill status={r.status} />
              </div>
            ))}
            {!data.reservations.length && <Empty t={t} />}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Reservations({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const tables = data.tables ?? []
  const tableName = (id?: string) => tables.find((x: any) => x.id === id)?.name ?? '—'
  return (
    <Card>
      <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.reservations')}</h3>
      <Table head={['Ref', t('admin.guest'), t('admin.date'), t('reserve.guests'), 'Table', t('admin.status'), t('admin.actions')]}>
        {data.reservations.map((r: any) => (
          <tr key={r.id} className="border-t border-border/40">
            <Td className="font-mono text-xs">{r.ref}</Td>
            <Td>{r.name}<div className="text-xs text-muted-foreground">{r.phone}</div></Td>
            <Td className="text-xs">{r.date} · {r.time}</Td>
            <Td>{r.guests}</Td>
            <Td>
              <select
                value={r.tableId || ''}
                onChange={(e) => act('reservation.assignTable', r.id, { tableId: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground outline-none"
              >
                <option value="">{tableName(r.tableId) === '—' ? 'Assign…' : tableName(r.tableId)}</option>
                {tables.map((tb: any) => <option key={tb.id} value={tb.id}>{tb.name} ({tb.seats})</option>)}
              </select>
            </Td>
            <Td><StatusPill status={r.status} /></Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {r.status === 'pending' && <IconBtn onClick={() => act('reservation.confirm', r.id)} title={t('admin.confirm')}><Check className="size-3.5" /></IconBtn>}
                {(r.status === 'confirmed' || r.status === 'pending') && <IconBtn onClick={() => act('reservation.seated', r.id)} title="Seat"><LogIn className="size-3.5" /></IconBtn>}
                {r.status === 'seated' && <IconBtn onClick={() => act('reservation.completed', r.id)} title="Complete"><Check className="size-3.5" /></IconBtn>}
                {r.status !== 'cancelled' && r.status !== 'completed' && <IconBtn onClick={() => act('reservation.noShow', r.id)} title="No-show"><X className="size-3.5" /></IconBtn>}
                {r.status !== 'cancelled' && <IconBtn danger onClick={() => act('reservation.cancel', r.id)} title={t('admin.cancel')}><X className="size-3.5" /></IconBtn>}
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      {!data.reservations.length && <Empty t={t} />}
    </Card>
  )
}

function Rooms({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const isManager = data?.me?.role === 'admin' || data?.me?.role === 'super_admin' || data?.me?.role === 'manager'
  const [creating, setCreating] = useState(false)
  const [nf, setNf] = useState({ name: '', priceUSD: '', totalUnits: '', maxGuests: '', description: '' })
  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end">
          <button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" /> New room type
          </button>
        </div>
      )}
      {creating && (
        <Card>
          <h4 className="mb-3 font-medium text-foreground">Create room type</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Name" className={inp} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
            <input placeholder="Price (USD)" type="number" className={inp} value={nf.priceUSD} onChange={(e) => setNf({ ...nf, priceUSD: e.target.value })} />
            <input placeholder="Total units" type="number" className={inp} value={nf.totalUnits} onChange={(e) => setNf({ ...nf, totalUnits: e.target.value })} />
            <input placeholder="Max guests" type="number" className={inp} value={nf.maxGuests} onChange={(e) => setNf({ ...nf, maxGuests: e.target.value })} />
            <textarea placeholder="Description" className={cn(inp, 'sm:col-span-2')} rows={2} value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} />
          </div>
          <button
            onClick={() => { if (nf.name) { act('room.create', undefined, nf); setNf({ name: '', priceUSD: '', totalUnits: '', maxGuests: '', description: '' }); setCreating(false) } }}
            className="mt-3 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >Create</button>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.rooms.map((r: any) => (
          <RoomEditorCard key={r.slug} r={r} act={act} t={t} isManager={isManager} />
        ))}
      </div>
    </div>
  )
}

function RoomEditorCard({ r, act, t, isManager }: { r: any; act: any; t: (k: string) => string; isManager: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(r.name)
  const [desc, setDesc] = useState(r.description ?? '')
  const [amen, setAmen] = useState(Array.isArray(r.amenities) ? r.amenities.join(', ') : '')
  return (
    <Card className={cn(r.active === false && 'opacity-60')}>
      <div className="overflow-hidden rounded-2xl border border-border/50">
        <ImageUpload value={r.image} onChange={(image) => act('room.update', r.slug, { image })} />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-serif text-lg text-foreground">{r.name}</h3>
        <StatusPill status={r.active === false ? 'inactive' : 'active'} />
      </div>
      <p className="text-xs text-muted-foreground">{r.availableNow} {t('booking.available')} · {r.totalUnits} total · slug: {r.slug}</p>
      <div className="mt-3 space-y-2">
        <EditRow label={`${t('admin.price')} $`} defaultValue={r.priceUSD} onSave={(v) => act('room.update', r.slug, { priceUSD: v })} />
        <EditRow label="Units" defaultValue={r.totalUnits} onSave={(v) => act('room.update', r.slug, { totalUnits: v })} />
        <EditRow label="Max guests" defaultValue={r.maxGuests} onSave={(v) => act('room.update', r.slug, { maxGuests: v })} />
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-3 w-full rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
        {open ? 'Hide details' : 'Edit name, description & amenities'}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-muted-foreground">Name
            <div className="mt-1 flex gap-2">
              <input className={cn(inp, 'flex-1')} value={name} onChange={(e) => setName(e.target.value)} />
              {name !== r.name && <button onClick={() => act('room.update', r.slug, { name })} className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></button>}
            </div>
          </label>
          <label className="block text-xs text-muted-foreground">Description
            <textarea rows={3} className={cn(inp, 'mt-1')} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
          {desc !== (r.description ?? '') && <button onClick={() => act('room.update', r.slug, { description: desc })} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Save description</button>}
          <label className="block text-xs text-muted-foreground">Amenities (comma separated)
            <textarea rows={2} className={cn(inp, 'mt-1')} value={amen} onChange={(e) => setAmen(e.target.value)} />
          </label>
          {amen !== (Array.isArray(r.amenities) ? r.amenities.join(', ') : '') && <button onClick={() => act('room.update', r.slug, { amenities: amen })} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Save amenities</button>}
        </div>
      )}

      {isManager && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
          <button onClick={() => act('room.toggle', r.slug)} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
            {r.active === false ? t('admin.enable') : t('admin.disable')}
          </button>
          <button onClick={() => { if (confirm(`Delete "${r.name}"? Only allowed if it has no active bookings.`)) act('room.remove', r.slug) }} className="rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">
            {t('admin.delete')}
          </button>
        </div>
      )}
    </Card>
  )
}

function RatesAddOns({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const addOns = data.addOns ?? []
  const rates = data.seasonalRates ?? []
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.addOns')}</h3>
        <Table head={[t('admin.addOnName'), t('admin.price'), t('admin.perNight'), t('admin.status'), t('admin.actions')]}>
          {addOns.map((a: any) => (
            <tr key={a.id} className="border-t border-border/40">
              <Td>{a.name}<div className="text-xs text-muted-foreground">{a.description}</div></Td>
              <Td>${a.priceUSD}</Td>
              <Td>{a.perNight ? t('admin.yes') : t('admin.no')}</Td>
              <Td><StatusPill status={a.active ? 'active' : 'inactive'} /></Td>
              <Td>
                <button onClick={() => act('addon.toggle', a.id)} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                  {a.active ? t('admin.disable') : t('admin.enable')}
                </button>
              </Td>
            </tr>
          ))}
        </Table>
        {!addOns.length && <Empty t={t} />}
      </Card>
      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.seasonalRates')}</h3>
        <Table head={[t('admin.rateName'), t('admin.period'), t('admin.multiplier'), t('admin.appliesTo'), t('admin.status'), t('admin.actions')]}>
          {rates.map((r: any) => (
            <tr key={r.id} className="border-t border-border/40">
              <Td>{r.name}</Td>
              <Td className="text-xs">{r.start} → {r.end}</Td>
              <Td>×{r.multiplier}</Td>
              <Td className="capitalize">{r.roomSlug || t('admin.allRooms')}</Td>
              <Td><StatusPill status={r.active ? 'active' : 'inactive'} /></Td>
              <Td>
                <button onClick={() => act('seasonalRate.toggle', r.id)} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                  {r.active ? t('admin.disable') : t('admin.enable')}
                </button>
              </Td>
            </tr>
          ))}
        </Table>
        {!rates.length && <Empty t={t} />}
      </Card>
    </div>
  )
}

const ORDER_FLOW: Record<string, string> = {
  new: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: 'completed',
}

function RestaurantPOS({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const orders = (data.orders ?? []).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled')
  const menu = data.menuItems ?? []
  const tables = data.tables ?? []
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((tb: any) => (
          <Card key={tb.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg text-foreground">{tb.name}</span>
              <StatusPill status={tb.status || 'available'} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{tb.seats} {t('admin.seats')} · {tb.location}</p>
          </Card>
        ))}
        {!tables.length && <Card><Empty t={t} /></Card>}
      </div>

      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.activeOrders')}</h3>
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="rounded-2xl border border-border/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{o.ref} · {o.tableName || o.guestName || t('admin.walkIn')}</p>
                  <p className="text-xs text-muted-foreground">{o.items.map((i: any) => `${i.qty}× ${i.name}`).join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{money(o.total, o.currency)}</span>
                  <StatusPill status={o.status} />
                  {ORDER_FLOW[o.status] && (
                    <button onClick={() => act('order.status', o.id, { status: ORDER_FLOW[o.status] })} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground capitalize">
                      {ORDER_FLOW[o.status].replace(/_/g, ' ')}
                    </button>
                  )}
                  {o.status !== 'cancelled' && (
                    <IconBtn danger onClick={() => act('order.status', o.id, { status: 'cancelled' })} title={t('admin.cancel')}><X className="size-3.5" /></IconBtn>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!orders.length && <Empty t={t} />}
        </div>
      </Card>

      <MenuManager menu={menu} act={act} t={t} />
    </div>
  )
}

const MENU_CATEGORIES = ['Breakfast', 'Nepali', 'Tibetan', 'Indian', 'Continental', 'Pizza', 'Momos', 'Drinks', 'Dessert', 'Himalayan Classics', 'From the Wood Oven', 'Warm Drinks', 'Other']

function MenuManager({ menu, act, t }: { menu: any[]; act: any; t: (k: string) => string }) {
  const [creating, setCreating] = useState(false)
  const [nf, setNf] = useState<any>({ name: '', category: 'Nepali', priceUSD: '', desc: '', vegetarian: false, featured: false, image: '' })
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-xl text-foreground">{t('admin.menuManagement')}</h3>
        <button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> New item</button>
      </div>

      {creating && (
        <div className="mb-4 rounded-2xl border border-border/40 p-4">
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <ImageUpload value={nf.image} onChange={(image) => setNf({ ...nf, image })} label="Food image" aspect="square" />
            <div className="grid gap-2 sm:grid-cols-2">
              <input placeholder="Name" className={inp} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
              <select className={inp} value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })}>
                {MENU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Price (USD)" type="number" className={inp} value={nf.priceUSD} onChange={(e) => setNf({ ...nf, priceUSD: e.target.value })} />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={nf.vegetarian} onChange={(e) => setNf({ ...nf, vegetarian: e.target.checked })} className="size-4 accent-[var(--color-primary)]" /> Veg</label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={nf.featured} onChange={(e) => setNf({ ...nf, featured: e.target.checked })} className="size-4 accent-[var(--color-primary)]" /> Featured</label>
              </div>
              <textarea placeholder="Description" rows={2} className={cn(inp, 'sm:col-span-2')} value={nf.desc} onChange={(e) => setNf({ ...nf, desc: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button disabled={!nf.name} onClick={() => { act('menu.create', undefined, { ...nf, priceUSD: Number(nf.priceUSD) || 0 }); setNf({ name: '', category: 'Nepali', priceUSD: '', desc: '', vegetarian: false, featured: false, image: '' }); setCreating(false) }} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Add item</button>
            <button onClick={() => setCreating(false)} className="rounded-full bg-muted px-4 py-2 text-sm text-foreground">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map((m: any) => (
          <MenuItemCard key={m.id} m={m} act={act} t={t} />
        ))}
      </div>
      {!menu.length && <Empty t={t} />}
    </Card>
  )
}

function MenuItemCard({ m, act, t }: { m: any; act: any; t: (k: string) => string }) {
  return (
    <div className={cn('rounded-2xl border border-border/40 p-3', !m.available && 'opacity-60')}>
      <ImageUpload value={m.image} onChange={(image) => act('menu.update', m.id, { image })} aspect="square" />
      <div className="mt-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{m.name}{m.vegetarian ? <span className="ml-1 text-xs text-success">{t('admin.veg')}</span> : ''}</p>
        <StatusPill status={m.available ? 'active' : 'inactive'} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-xs text-muted-foreground">Price $
          <input type="number" defaultValue={m.priceUSD} className={cn(inp, 'mt-1')} onBlur={(e) => { const v = Number(e.target.value); if (v !== m.priceUSD) act('menu.update', m.id, { priceUSD: v }) }} />
        </label>
        <label className="block text-xs text-muted-foreground">Category
          <select value={m.category} className={cn(inp, 'mt-1')} onChange={(e) => act('menu.update', m.id, { category: e.target.value })}>
            {[...MENU_CATEGORIES, m.category].filter((v, i, a) => a.indexOf(v) === i).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
        <button onClick={() => act('menu.update', m.id, { vegetarian: !m.vegetarian })} className={cn('rounded-full px-2.5 py-1 text-xs', m.vegetarian ? 'bg-success/15 text-success' : 'bg-muted text-foreground')}>Veg</button>
        <button onClick={() => act('menu.update', m.id, { featured: !m.featured })} className={cn('rounded-full px-2.5 py-1 text-xs', m.featured ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground')}>Featured</button>
        <button onClick={() => act('menu.toggle', m.id)} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{m.available ? t('admin.hide') : t('admin.show')}</button>
        <button onClick={() => { if (confirm(`Delete "${m.name}"?`)) act('menu.remove', m.id) }} className="ml-auto grid size-7 place-items-center rounded-full bg-destructive/15 text-destructive"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
  )
}

function Customers({ data, t }: { data: any; t: (k: string) => string }) {
  return (
    <Card>
      <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.customers')}</h3>
      <Table head={[t('common.fullName'), t('common.email'), t('common.phone'), t('admin.bookings'), t('admin.date')]}>
        {data.customers.map((c: any) => (
          <tr key={c.id} className="border-t border-border/40">
            <Td>{c.name}</Td>
            <Td className="text-xs">{c.email}{c.emailVerified ? ' ✓' : ''}</Td>
            <Td className="text-xs">{c.phone || '—'}</Td>
            <Td>{c.bookings}</Td>
            <Td className="text-xs">{formatDate(c.createdAt)}</Td>
          </tr>
        ))}
      </Table>
      {!data.customers.length && <Empty t={t} />}
    </Card>
  )
}

const STAFF_ROLES = ['manager', 'front_desk', 'housekeeping', 'restaurant', 'accountant'] as const
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  manager: 'Manager',
  front_desk: 'Front desk',
  housekeeping: 'Housekeeping',
  restaurant: 'Restaurant',
  accountant: 'Accountant',
}

function Staff({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const myRole = data?.me?.role
  const myId = data?.me?.id
  const canManageRoles = myRole === 'admin' || myRole === 'super_admin'
  const team: any[] = data?.team ?? []
  const [form, setForm] = useState({ name: '', role: 'front_desk', email: '', phone: '' })
  const [grant, setGrant] = useState({ email: '', role: 'front_desk' })
  // Owners/admins can never be demoted or removed via this panel.
  const isProtected = (r: string) => r === 'admin' || r === 'super_admin'
  return (
    <div className="space-y-4">
      {/* --- Back-office access (RBAC on login accounts) --- */}
      <Card>
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="font-serif text-xl text-foreground">Back-office access</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Login accounts that can sign in to this dashboard. Change a role to adjust what each person can do.</p>
        <Table head={[t('common.fullName'), t('common.email'), 'Access role', '']}>
          {team.map((u: any) => {
            const editable = canManageRoles && !isProtected(u.role) && u.id !== myId
            return (
              <tr key={u.id} className="border-t border-border/40">
                <Td>{u.name}{u.id === myId ? <span className="ml-1 text-xs text-primary">(you)</span> : ''}</Td>
                <Td className="text-xs">{u.email}</Td>
                <Td>
                  {editable ? (
                    <select
                      value={u.role}
                      onChange={(e) => act('staff.setRole', undefined, { email: u.email, role: e.target.value })}
                      className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-xs text-foreground outline-none"
                    >
                      {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm">{ROLE_LABEL[u.role] ?? u.role}</span>
                  )}
                </Td>
                <Td>
                  {editable
                    ? <IconBtn danger onClick={() => { if (confirm(`Revoke ${u.name}'s back-office access?`)) act('staff.setRole', undefined, { email: u.email, role: 'customer' }) }} title="Revoke access"><X className="size-3.5" /></IconBtn>
                    : <ShieldCheck className="size-3.5 text-muted-foreground" />}
                </Td>
              </tr>
            )
          })}
        </Table>
        {!team.length && <Empty t={t} />}
        {canManageRoles && (
          <div className="mt-4 border-t border-border/40 pt-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Grant access to an existing account</h4>
            <p className="mb-3 text-xs text-muted-foreground">Enter the email of a registered user to promote them into a staff role.</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input placeholder="user@email.com" type="email" className={inp} value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} />
              <select className={inp} value={grant.role} onChange={(e) => setGrant({ ...grant, role: e.target.value })}>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <button
                onClick={async () => { if (grant.email) { const res = await act('staff.setRole', undefined, grant); if (res?.ok) setGrant({ email: '', role: 'front_desk' }) } }}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                <ShieldCheck className="size-4" /> Grant
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* --- Informational staff roster --- */}
      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.staff')}</h3>
        <Table head={[t('common.fullName'), 'Role', t('common.email'), t('common.phone'), '']}>
          {data.staff.map((s: any) => (
            <tr key={s.id} className="border-t border-border/40">
              <Td>{s.name}</Td>
              <Td>{ROLE_LABEL[s.role] ?? s.role}</Td>
              <Td className="text-xs">{s.email || '—'}</Td>
              <Td className="text-xs">{s.phone || '—'}</Td>
              <Td><IconBtn danger onClick={() => { if (confirm(`Remove ${s.name} from the roster?`)) act('staff.remove', s.id) }} title="Remove"><X className="size-3.5" /></IconBtn></Td>
            </tr>
          ))}
        </Table>
        {!data.staff.length && <Empty t={t} />}
      </Card>
      <Card>
        <h4 className="mb-3 font-medium text-foreground">Add staff to roster</h4>
        <div className="grid gap-2 sm:grid-cols-4">
          <input placeholder="Name" className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <input placeholder="Email" type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" className={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button
          onClick={() => { if (form.name) { act('staff.create', undefined, form); setForm({ name: '', role: 'front_desk', email: '', phone: '' }) } }}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="size-4" /> Add
        </button>
      </Card>
    </div>
  )
}

function Payments({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const isManager = data?.me?.role === 'admin' || data?.me?.role === 'super_admin' || data?.me?.role === 'manager'
  const bookingRef = (id: string) => data.bookings.find((b: any) => b.id === id)?.ref ?? '—'
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-xl text-foreground">{t('admin.payments')}</h3>
        {isManager && <a href="/api/admin/export?type=payments" className="rounded-full bg-muted px-3 py-1.5 text-xs text-foreground hover:bg-foreground/10">Export CSV</a>}
      </div>
      <Table head={['Txn', 'Booking', 'Provider', t('admin.amount'), t('admin.status'), 'Verified', t('admin.date'), isManager ? 'Reconcile' : '']}>
        {data.payments.map((p: any) => (
          <tr key={p.id} className="border-t border-border/40">
            <Td className="font-mono text-xs">{p.transactionUuid}</Td>
            <Td className="font-mono text-xs">{bookingRef(p.bookingId)}</Td>
            <Td className="capitalize">{p.provider}</Td>
            <Td>NPR {p.amount.toLocaleString()}</Td>
            <Td><StatusPill status={p.status} /></Td>
            <Td className="text-xs text-muted-foreground">{p.verifiedAt ? formatDateTime(p.verifiedAt) : '—'}</Td>
            <Td className="text-xs">{formatDateTime(p.createdAt)}</Td>
            <Td>
              {isManager ? (
                <select
                  value={p.status}
                  onChange={(e) => { if (confirm(`Set payment to "${e.target.value}"? This is an authorized override and will be recorded in the audit log.`)) act('payment.reconcile', p.id, { status: e.target.value }) }}
                  className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-xs capitalize text-foreground outline-none"
                >
                  {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : null}
            </Td>
          </tr>
        ))}
      </Table>
      {!data.payments.length && <Empty t={t} />}
    </Card>
  )
}

function Reviews({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  return (
    <Card>
      <h3 className="mb-1 font-serif text-xl text-foreground">{t('admin.reviews')}</h3>
      <p className="mb-4 text-xs text-muted-foreground">Only approved reviews appear publicly.</p>
      <div className="space-y-3">
        {data.reviews.map((r: any) => (
          <div key={r.id} className="flex items-start justify-between gap-4 border-t border-border/40 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {r.name} <span className="text-xs text-muted-foreground">· {r.country} · <span className="text-amber-500">{'★'.repeat(r.rating)}</span>{r.trip ? ` · ${r.trip}` : ''}</span>
              </p>
              <p className="text-sm text-muted-foreground">{r.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => act('review.feature', r.id)}
                className={cn('flex items-center gap-1 rounded-full px-3 py-1.5 text-xs', r.featured ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground')}
                title="Feature on homepage"
              >
                <Star className={cn('size-3.5', r.featured && 'fill-current')} /> {r.featured ? 'Featured' : 'Feature'}
              </button>
              <button
                onClick={() => act('review.toggle', r.id)}
                className={cn('rounded-full px-3 py-1.5 text-xs', r.approved ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-600')}
              >
                {r.approved ? t('admin.approve') + 'd' : t('admin.approve')}
              </button>
              <IconBtn danger onClick={() => { if (confirm('Delete this review permanently?')) act('review.delete', r.id) }} title="Delete"><Trash2 className="size-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>
      {!data.reviews.length && <Empty t={t} />}
    </Card>
  )
}

function Offers({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const isManager = data?.me?.role === 'admin' || data?.me?.role === 'super_admin' || data?.me?.role === 'manager'
  const [creating, setCreating] = useState(false)
  const [of, setOf] = useState({ title: '', tag: '', price: '', desc: '', includes: '' })
  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end">
          <button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" /> New offer
          </button>
        </div>
      )}
      {creating && (
        <Card>
          <h4 className="mb-3 font-medium text-foreground">Create offer</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Title" className={inp} value={of.title} onChange={(e) => setOf({ ...of, title: e.target.value })} />
            <input placeholder="Tag (e.g. Trekker Special)" className={inp} value={of.tag} onChange={(e) => setOf({ ...of, tag: e.target.value })} />
            <input placeholder="Price (e.g. $120 / 2 nights)" className={inp} value={of.price} onChange={(e) => setOf({ ...of, price: e.target.value })} />
            <input placeholder="Includes (comma separated)" className={inp} value={of.includes} onChange={(e) => setOf({ ...of, includes: e.target.value })} />
            <textarea placeholder="Description" className={cn(inp, 'sm:col-span-2')} rows={2} value={of.desc} onChange={(e) => setOf({ ...of, desc: e.target.value })} />
          </div>
          <button
            onClick={() => { if (of.title) { act('offer.create', undefined, of); setOf({ title: '', tag: '', price: '', desc: '', includes: '' }); setCreating(false) } }}
            className="mt-3 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >Create</button>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.offers.map((o: any) => (
          <Card key={o.id}>
            <div className="overflow-hidden rounded-2xl border border-border/50">
              <ImageUpload value={o.image} onChange={(image) => act('offer.update', o.id, { image })} />
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">{o.title}</h3>
              <button
                onClick={() => act('offer.toggle', o.id)}
                className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs', o.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}
              >
                {o.active ? t('admin.active') : t('admin.inactive')}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{o.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
            {isManager && (
              <button onClick={() => { if (confirm(`Delete offer "${o.title}"?`)) act('offer.remove', o.id) }} className="mt-3 flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">
                <Trash2 className="size-3.5" /> {t('admin.delete')}
              </button>
            )}
          </Card>
        ))}
        {!data.offers.length && <Empty t={t} />}
      </div>
    </div>
  )
}

function Coupons({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const isManager = data?.me?.role === 'admin' || data?.me?.role === 'super_admin' || data?.me?.role === 'manager'
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', minNights: '', minBookingValueUSD: '', usageLimit: '', expires: '', description: '' })
  // Usage stats: count non-cancelled bookings that used each code.
  const usage = (code: string) =>
    data.bookings.filter((b: any) => b.couponCode?.toUpperCase() === code.toUpperCase() && b.status !== 'cancelled').length
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">{t('admin.coupons')}</h3>
        <Table head={['Code', 'Type', 'Value', 'Min nights', 'Min value', 'Used', 'Limit', 'Expires', t('admin.status'), '']}>
          {data.coupons.map((c: any) => {
            const used = usage(c.code)
            return (
              <tr key={c.code} className="border-t border-border/40">
                <Td className="font-mono">{c.code}</Td>
                <Td>{c.type}</Td>
                <Td>{c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</Td>
                <Td>{c.minNights || '—'}</Td>
                <Td>{c.minBookingValueUSD ? `$${c.minBookingValueUSD}` : '—'}</Td>
                <Td>{used}</Td>
                <Td>{c.usageLimit || '∞'}</Td>
                <Td className="text-xs">{c.expires ? formatDate(c.expires) : '—'}</Td>
                <Td><StatusPill status={c.active ? 'active' : 'inactive'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => act('coupon.toggle', c.code)} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                      {c.active ? t('admin.disable') : t('admin.enable')}
                    </button>
                    {isManager && <IconBtn danger onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) act('coupon.remove', c.code) }} title="Delete"><Trash2 className="size-3.5" /></IconBtn>}
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
        {!data.coupons.length && <Empty t={t} />}
      </Card>
      {isManager && (
        <Card>
          <h4 className="mb-3 font-medium text-foreground">Create coupon</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            <input placeholder="CODE" className={inp} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">percent</option>
              <option value="fixed">fixed</option>
            </select>
            <input placeholder="Value" type="number" className={inp} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <input placeholder="Min nights" type="number" className={inp} value={form.minNights} onChange={(e) => setForm({ ...form, minNights: e.target.value })} />
            <input placeholder="Min booking value ($)" type="number" className={inp} value={form.minBookingValueUSD} onChange={(e) => setForm({ ...form, minBookingValueUSD: e.target.value })} />
            <input placeholder="Usage limit" type="number" className={inp} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            <input placeholder="Expires" type="date" className={inp} value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} />
            <input placeholder="Description" className={cn(inp, 'sm:col-span-2')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button
            onClick={() => { if (form.code && form.value) { act('coupon.create', undefined, form); setForm({ code: '', type: 'percent', value: '', minNights: '', minBookingValueUSD: '', usageLimit: '', expires: '', description: '' }) } }}
            className="mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="size-4" /> Create
          </button>
        </Card>
      )}
    </div>
  )
}

function Notifications({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const hasUnread = (data.notifications ?? []).some((n: any) => !n.read)
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl text-foreground">{t('admin.notifications')}</h3>
        {hasUnread && (
          <button onClick={() => act('notification.readAll')} className="rounded-full bg-muted px-3 py-1.5 text-xs text-foreground hover:bg-foreground/10">
            {t('admin.markAllRead')}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {data.notifications.map((n: any) => (
          <button
            key={n.id}
            onClick={() => !n.read && act('notification.read', n.id)}
            className={cn('block w-full rounded-2xl border-t border-border/40 p-3 text-left text-sm', !n.read && 'bg-primary/5')}
          >
            <div className="flex items-center gap-2">
              {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
              <p className="font-medium text-foreground">{n.title}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{n.body} · {formatDateTime(n.createdAt)}</p>
          </button>
        ))}
      </div>
      {!data.notifications.length && <Empty t={t} />}
    </Card>
  )
}

function Reports({ data, t }: { data: any; t: (k: string) => string }) {
  const paid = data.payments.filter((p: any) => p.status === 'paid')
  const byProvider = paid.reduce((acc: Record<string, number>, p: any) => {
    acc[p.provider] = (acc[p.provider] || 0) + p.amount
    return acc
  }, {})
  const confirmed = data.bookings.filter((b: any) => b.status === 'confirmed').length
  const cancelled = data.bookings.filter((b: any) => b.status === 'cancelled').length

  function exportBookingsCsv() {
    const cols = ['ref', 'guestName', 'roomName', 'checkIn', 'checkOut', 'nights', 'rooms', 'guests', 'currency', 'total', 'status', 'paymentStatus', 'source']
    const header = cols.join(',')
    const rows = data.bookings.map((b: any) =>
      cols.map((c) => {
        const v = b[c] ?? ''
        const s = String(v).replace(/"/g, '""')
        return /[",\n]/.test(s) ? `"${s}"` : s
      }).join(','),
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={exportBookingsCsv} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Download className="size-4" /> {t('admin.exportCsv')}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-wider text-muted-foreground">{t('admin.totalRevenue')}</p><p className="mt-2 font-serif text-3xl text-foreground">${data.stats.revenue.toLocaleString()}</p></Card>
        <Card><p className="text-xs uppercase tracking-wider text-muted-foreground">{t('admin.confirm')}</p><p className="mt-2 font-serif text-3xl text-foreground">{confirmed}</p></Card>
        <Card><p className="text-xs uppercase tracking-wider text-muted-foreground">{t('admin.cancel')}</p><p className="mt-2 font-serif text-3xl text-foreground">{cancelled}</p></Card>
      </div>
      <Card>
        <h3 className="mb-3 font-serif text-lg text-foreground">{t('admin.payments')} — {t('admin.totalRevenue')}</h3>
        <div className="space-y-2">
          {Object.entries(byProvider).map(([prov, amt]) => (
            <div key={prov} className="flex items-center justify-between text-sm">
              <span className="capitalize text-foreground">{prov}</span>
              <span className="text-muted-foreground">NPR {(amt as number).toLocaleString()}</span>
            </div>
          ))}
          {!paid.length && <Empty t={t} />}
        </div>
      </Card>
    </div>
  )
}

/* ---- Front Desk (PMS) ---- */
const ROOM_STATUS_STYLE: Record<string, string> = {
  available: 'bg-success/15 text-success border-success/30',
  occupied: 'bg-primary/15 text-primary border-primary/30',
  reserved: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  cleaning: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  maintenance: 'bg-destructive/15 text-destructive border-destructive/30',
  out_of_service: 'bg-muted text-muted-foreground border-border',
}
const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service']

function FrontDesk({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const arrivals = data.arrivals ?? []
  const departures = data.departures ?? []
  const inHouse = data.bookings.filter((b: any) => b.status === 'checked_in')
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-serif text-lg text-foreground"><LogIn className="size-4 text-primary" /> {t('admin.arrivalsToday')}</h3>
          <div className="space-y-2">
            {arrivals.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-sm">
                <div>
                  <p className="text-foreground">{b.guestName} <span className="text-xs text-muted-foreground">· {b.ref}</span></p>
                  <p className="text-xs text-muted-foreground">{b.roomName} · {b.rooms} room · {b.guests}g · {b.paymentStatus}</p>
                </div>
                {b.status === 'checked_in' ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary">{b.roomNumbers?.join(', ') || t('admin.inHouse')}</span>
                ) : b.status === 'cancelled' || b.status === 'no_show' ? (
                  <StatusPill status={b.status} />
                ) : (
                  <button onClick={() => act('booking.checkIn', b.id)} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{t('admin.checkIn')}</button>
                )}
              </div>
            ))}
            {!arrivals.length && <Empty t={t} />}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-serif text-lg text-foreground"><LogOut className="size-4 text-primary" /> {t('admin.departuresToday')}</h3>
          <div className="space-y-2">
            {departures.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-sm">
                <div>
                  <p className="text-foreground">{b.guestName} <span className="text-xs text-muted-foreground">· {b.ref}</span></p>
                  <p className="text-xs text-muted-foreground">{b.roomName} · {b.roomNumbers?.join(', ') || '—'}</p>
                </div>
                {b.status === 'checked_in' ? (
                  <button onClick={() => act('booking.checkOut', b.id)} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">{t('admin.checkOut')}</button>
                ) : (
                  <StatusPill status={b.status} />
                )}
              </div>
            ))}
            {!departures.length && <Empty t={t} />}
          </div>
        </Card>
      </div>

      {!!inHouse.length && (
        <Card>
          <h3 className="mb-3 font-serif text-lg text-foreground">{t('admin.inHouse')} ({inHouse.length})</h3>
          <div className="flex flex-wrap gap-2">
            {inHouse.map((b: any) => (
              <div key={b.id} className="glass flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs">
                <span className="font-medium text-foreground">{b.roomNumbers?.join(', ')}</span>
                <span className="text-muted-foreground">{b.guestName}</span>
                <button onClick={() => act('booking.checkOut', b.id)} className="text-primary hover:underline">{t('admin.checkOut')}</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-foreground">{t('admin.roomStatusBoard')}</h3>
          <div className="flex flex-wrap gap-2 text-[0.65rem]">
            {ROOM_STATUSES.map((st) => (
              <span key={st} className={cn('rounded-full border px-2 py-0.5 capitalize', ROOM_STATUS_STYLE[st])}>{st.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(data.physicalRooms ?? []).map((r: any) => (
            <div key={r.number} className={cn('rounded-2xl border p-3', ROOM_STATUS_STYLE[r.status] ?? 'border-border')}>
              <div className="flex items-center justify-between">
                <span className="font-serif text-xl text-foreground">{r.number}</span>
                <BedDouble className="size-4 opacity-70" />
              </div>
              <p className="mt-0.5 text-[0.7rem] capitalize text-muted-foreground">{r.roomSlug} · fl {r.floor}</p>
              <select
                value={r.status}
                onChange={(e) => act('room.setStatus', r.number, { status: e.target.value })}
                className="mt-2 w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-xs capitalize text-foreground outline-none"
              >
                {ROOM_STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
              </select>
              <p className="mt-1 text-[0.65rem] capitalize text-muted-foreground">HK: {r.housekeeping}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Housekeeping({ data, act, t }: { data: any; act: any; t: (k: string) => string }) {
  const tasks = (data.housekeepingTasks ?? []).filter((x: any) => x.status !== 'completed')
  const dirty = (data.physicalRooms ?? []).filter((r: any) => r.housekeeping !== 'clean' || r.status === 'cleaning')
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-lg text-foreground"><Sparkles className="size-4 text-primary" /> {t('admin.cleaningQueue')}</h3>
        <Table head={[t('admin.rooms'), 'Type', 'Priority', t('admin.status'), t('admin.actions')]}>
          {tasks.map((task: any) => (
            <tr key={task.id} className="border-t border-border/40">
              <Td className="font-serif text-base">{task.roomNumber}</Td>
              <Td className="capitalize">{task.type === 'maintenance' ? <span className="flex items-center gap-1"><Wrench className="size-3.5" /> {task.type}</span> : task.type}</Td>
              <Td className="capitalize">{task.priority}</Td>
              <Td><StatusPill status={task.status === 'in_progress' ? 'pending' : task.status} /></Td>
              <Td><button onClick={() => act('hk.complete', task.id)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"><Check className="size-3.5" /> {t('admin.complete')}</button></Td>
            </tr>
          ))}
        </Table>
        {!tasks.length && <Empty t={t} />}
      </Card>
      <Card>
        <h3 className="mb-3 font-serif text-lg text-foreground">{t('admin.roomsToClean')}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {dirty.map((r: any) => (
            <div key={r.number} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="font-serif text-lg text-foreground">{r.number}</span>
              <p className="text-[0.7rem] capitalize text-muted-foreground">{r.roomSlug} · {r.housekeeping}</p>
              <button onClick={() => act('room.housekeeping', r.number, { housekeeping: 'clean' })} className="mt-2 w-full rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground">{t('admin.markClean')}</button>
            </div>
          ))}
          {!dirty.length && <p className="col-span-full py-4 text-center text-sm text-muted-foreground">{t('admin.allClean')}</p>}
        </div>
      </Card>
    </div>
  )
}

/* ---- shared bits ---- */
const inp = 'w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60'

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => <th key={i} className="pb-2 pr-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('py-2.5 pr-3 align-top text-foreground', className)}>{children}</td>
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn('grid size-7 place-items-center rounded-full transition-colors', danger ? 'bg-destructive/15 text-destructive hover:bg-destructive/25' : 'bg-primary/15 text-primary hover:bg-primary/25')}
    >
      {children}
    </button>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-success/15 text-success',
    paid: 'bg-success/15 text-success',
    active: 'bg-success/15 text-success',
    seated: 'bg-success/15 text-success',
    completed: 'bg-success/15 text-success',
    checked_in: 'bg-primary/15 text-primary',
    checked_out: 'bg-blue-500/15 text-blue-500',
    partial: 'bg-amber-500/15 text-amber-600',
    pending: 'bg-amber-500/15 text-amber-600',
    cancelled: 'bg-destructive/15 text-destructive',
    no_show: 'bg-destructive/15 text-destructive',
    failed: 'bg-destructive/15 text-destructive',
    refunded: 'bg-blue-500/15 text-blue-500',
    inactive: 'bg-muted text-muted-foreground',
    unpaid: 'bg-muted text-muted-foreground',
  }
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize', map[status] ?? 'bg-muted text-muted-foreground')}>{String(status).replace(/_/g, ' ')}</span>
}

function EditRow({ label, defaultValue, onSave }: { label: string; defaultValue: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState(String(defaultValue))
  const changed = val !== String(defaultValue)
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted-foreground">{label}</span>
      <input className={cn(inp, 'flex-1')} value={val} onChange={(e) => setVal(e.target.value)} inputMode="numeric" />
      {changed && (
        <button onClick={() => onSave(Number(val))} className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function Empty({ t }: { t: (k: string) => string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{t('admin.empty')}</p>
}
