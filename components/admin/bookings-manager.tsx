'use client'

import { useMemo, useState } from 'react'
import {
  Check, X, CreditCard, LogIn, LogOut, Search, Mail, MessageCircle, ChevronLeft, ChevronRight, Ban, RotateCcw,
} from 'lucide-react'
import { money, formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

const PAGE_SIZE = 12

const BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show']
const PAYMENT_STATUSES = ['unpaid', 'pending', 'partial', 'paid', 'failed', 'refunded']

export function BookingsManager({
  data,
  act,
  rooms,
}: {
  data: any
  act: (a: string, id?: string, p?: unknown) => Promise<any> | void
  rooms: { slug: string; name: string }[]
}) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [room, setRoom] = useState('all')
  const [sort, setSort] = useState<'newest' | 'checkin' | 'total'>('newest')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<any | null>(null)

  const filtered = useMemo(() => {
    let list: any[] = [...(data.bookings ?? [])]
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(
        (b) =>
          b.ref.toLowerCase().includes(s) ||
          b.guestName.toLowerCase().includes(s) ||
          (b.guestEmail || '').toLowerCase().includes(s) ||
          (b.guestPhone || '').toLowerCase().includes(s),
      )
    }
    if (status !== 'all') list = list.filter((b) => b.status === status)
    if (payment !== 'all') list = list.filter((b) => b.paymentStatus === payment)
    if (room !== 'all') list = list.filter((b) => b.roomSlug === room)
    if (sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt)
    if (sort === 'checkin') list.sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    if (sort === 'total') list.sort((a, b) => b.total - a.total)
    return list
  }, [data.bookings, q, status, payment, room, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampPage = Math.min(page, pages - 1)
  const slice = filtered.slice(clampPage * PAGE_SIZE, clampPage * PAGE_SIZE + PAGE_SIZE)

  // Refresh the selected booking from latest data so the drawer stays in sync.
  const current = selected ? (data.bookings ?? []).find((b: any) => b.id === selected.id) ?? selected : null

  return (
    <div className="glass-strong rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl text-foreground">Bookings <span className="text-sm text-muted-foreground">({filtered.length})</span></h3>
        <a href="/api/admin/export?type=bookings" className="rounded-full bg-muted px-3 py-1.5 text-xs text-foreground hover:bg-foreground/10">Export CSV</a>
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0) }}
            placeholder="Search ref, guest, email, phone…"
            className="w-full rounded-xl border border-border/70 bg-background/40 py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/60"
          />
        </div>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={['all', ...BOOKING_STATUSES]} />
        <Select value={payment} onChange={(v) => { setPayment(v); setPage(0) }} options={['all', ...PAYMENT_STATUSES]} prefix="pay: " />
        <Select value={room} onChange={(v) => { setRoom(v); setPage(0) }} options={['all', ...rooms.map((r) => r.slug)]} labelMap={Object.fromEntries(rooms.map((r) => [r.slug, r.name]))} />
        <Select value={sort} onChange={(v) => setSort(v as any)} options={['newest', 'checkin', 'total']} prefix="sort: " />
      </div>

      {/* table (desktop) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              {['Ref', 'Guest', 'Room', 'Stay', 'Total', 'Payment', 'Status', ''].map((h) => (
                <th key={h} className="pb-2 pr-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((b) => (
              <tr key={b.id} className="cursor-pointer border-t border-border/40 hover:bg-foreground/5" onClick={() => setSelected(b)}>
                <td className="py-2 pr-3 font-mono text-xs">{b.ref}</td>
                <td className="py-2 pr-3">{b.guestName}<div className="text-xs text-muted-foreground">{b.guestEmail}</div></td>
                <td className="py-2 pr-3">{b.roomName}<div className="text-xs text-muted-foreground">{b.rooms}r · {b.guests}g</div></td>
                <td className="py-2 pr-3 text-xs">{formatDate(b.checkIn)}<div className="text-muted-foreground">→ {formatDate(b.checkOut)}</div></td>
                <td className="py-2 pr-3">{money(b.total, b.currency)}</td>
                <td className="py-2 pr-3"><StatusPill status={b.paymentStatus} /></td>
                <td className="py-2 pr-3"><StatusPill status={b.status} /></td>
                <td className="py-2 pr-3 text-primary"><ChevronRight className="size-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* cards (mobile) */}
      <div className="space-y-2 md:hidden">
        {slice.map((b) => (
          <button key={b.id} onClick={() => setSelected(b)} className="glass w-full rounded-2xl p-3 text-left">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground">{b.ref}</span>
              <StatusPill status={b.status} />
            </div>
            <p className="mt-1 text-sm text-foreground">{b.guestName} · {b.roomName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {money(b.total, b.currency)}</p>
          </button>
        ))}
      </div>

      {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No bookings match your filters.</p>}

      {/* pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={clampPage === 0} onClick={() => setPage(clampPage - 1)} className="glass flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-40"><ChevronLeft className="size-4" /> Prev</button>
          <span className="text-muted-foreground">Page {clampPage + 1} of {pages}</span>
          <button disabled={clampPage >= pages - 1} onClick={() => setPage(clampPage + 1)} className="glass flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-40">Next <ChevronRight className="size-4" /></button>
        </div>
      )}

      {current && <BookingDrawer booking={current} act={act} onClose={() => setSelected(null)} />}
    </div>
  )
}

function BookingDrawer({ booking: b, act, onClose }: { booking: any; act: any; onClose: () => void }) {
  const [note, setNote] = useState(b.staffNotes || '')
  const [refund, setRefund] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function run(action: string, payload?: unknown) {
    setBusy(action)
    await act(action, b.id, payload)
    setBusy(null)
  }

  const waMsg = encodeURIComponent(
    `Hello ${b.guestName}, regarding your Hotel Mountain Bridge booking ${b.ref} (${b.roomName}, ${b.checkIn} to ${b.checkOut}).`,
  )
  const waNumber = (b.guestPhone || '').replace(/[^0-9]/g, '')

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong h-full w-full max-w-md overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{b.ref}</p>
            <h3 className="font-serif text-2xl text-foreground">{b.guestName}</h3>
          </div>
          <button onClick={onClose} className="glass rounded-full p-2 text-foreground"><X className="size-4" /></button>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill status={b.status} /><StatusPill status={b.paymentStatus} />
          {b.source && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize text-muted-foreground">{b.source}</span>}
        </div>

        <Section title="Guest">
          <Row k="Email" v={b.guestEmail} />
          <Row k="Phone" v={b.guestPhone || '—'} />
        </Section>

        <Section title="Stay">
          <Row k="Room" v={`${b.roomName} × ${b.rooms}`} />
          <Row k="Check-in" v={formatDate(b.checkIn)} />
          <Row k="Check-out" v={formatDate(b.checkOut)} />
          <Row k="Nights" v={String(b.nights)} />
          <Row k="Guests" v={String(b.guests)} />
          {b.roomNumbers?.length ? <Row k="Rooms assigned" v={b.roomNumbers.join(', ')} /> : null}
        </Section>

        <Section title="Financial">
          <Row k="Subtotal" v={money(b.subtotal, b.currency)} />
          {b.discount ? <Row k="Discount" v={`− ${money(b.discount, b.currency)}`} /> : null}
          <Row k="Tax & service" v={money(b.tax, b.currency)} />
          <Row k="Total" v={money(b.total, b.currency)} strong />
          <Row k="Method" v={b.paymentMethod || '—'} />
          {b.refundAmount ? <Row k="Refunded" v={money(b.refundAmount, b.currency)} /> : null}
        </Section>

        <Section title="Actions">
          <div className="grid grid-cols-2 gap-2">
            {b.status !== 'confirmed' && b.status !== 'cancelled' && <ActBtn onClick={() => run('booking.confirm')} busy={busy === 'booking.confirm'} icon={Check}>Confirm</ActBtn>}
            {b.paymentStatus !== 'paid' && <ActBtn onClick={() => run('booking.markPaid')} busy={busy === 'booking.markPaid'} icon={CreditCard}>Mark paid</ActBtn>}
            {b.status !== 'checked_in' && b.status !== 'checked_out' && b.status !== 'cancelled' && <ActBtn onClick={() => run('booking.checkIn')} busy={busy === 'booking.checkIn'} icon={LogIn}>Check in</ActBtn>}
            {b.status === 'checked_in' && <ActBtn onClick={() => run('booking.checkOut')} busy={busy === 'booking.checkOut'} icon={LogOut}>Check out</ActBtn>}
            {b.status !== 'cancelled' && b.status !== 'checked_in' && <ActBtn onClick={() => run('booking.noShow')} busy={busy === 'booking.noShow'} icon={Ban}>No-show</ActBtn>}
            {b.status !== 'cancelled' && <ActBtn danger onClick={() => run('booking.cancel')} busy={busy === 'booking.cancel'} icon={X}>Cancel</ActBtn>}
          </div>
        </Section>

        <Section title="Communication">
          <div className="grid grid-cols-2 gap-2">
            <ActBtn onClick={() => run('booking.sendEmail', { kind: 'confirmation' })} busy={busy === 'booking.sendEmail'} icon={Mail}>Send email</ActBtn>
            {waNumber ? (
              <a href={`https://wa.me/${waNumber}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 py-2 text-xs font-medium text-[#128C7E]">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            ) : null}
          </div>
        </Section>

        <Section title="Refund">
          <div className="flex items-center gap-2">
            <input type="number" value={refund} onChange={(e) => setRefund(e.target.value)} placeholder={`Amount (${b.currency})`} className="w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none" />
            <button onClick={() => { if (Number(refund) > 0) { run('booking.refund', { amount: Number(refund) }); setRefund('') } }} className="flex shrink-0 items-center gap-1 rounded-xl bg-destructive/15 px-3 py-2 text-xs font-medium text-destructive"><RotateCcw className="size-3.5" /> Refund</button>
          </div>
        </Section>

        <Section title="Staff notes">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none" />
          <button onClick={() => run('booking.note', { staffNotes: note })} className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground">Save note</button>
        </Section>

        <p className="mt-4 text-center text-xs text-muted-foreground">Created {formatDateTime(b.createdAt)}</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn('text-right', strong ? 'font-serif text-lg text-foreground' : 'text-foreground')}>{v}</span>
    </div>
  )
}

function ActBtn({ children, onClick, icon: Icon, danger, busy }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; danger?: boolean; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
        danger ? 'bg-destructive/15 text-destructive hover:bg-destructive/25' : 'bg-primary/12 text-primary hover:bg-primary/20',
      )}
    >
      <Icon className="size-4" /> {children}
    </button>
  )
}

function Select({ value, onChange, options, labelMap, prefix = '' }: { value: string; onChange: (v: string) => void; options: string[]; labelMap?: Record<string, string>; prefix?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-xs capitalize text-foreground outline-none focus:border-primary/60">
      {options.map((o) => (
        <option key={o} value={o}>{prefix}{o === 'all' ? 'All' : labelMap?.[o] ?? o.replace(/_/g, ' ')}</option>
      ))}
    </select>
  )
}

const PILL: Record<string, string> = {
  confirmed: 'bg-success/15 text-success',
  paid: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success',
  checked_in: 'bg-primary/15 text-primary',
  checked_out: 'bg-blue-500/15 text-blue-500',
  pending: 'bg-amber-500/15 text-amber-600',
  partial: 'bg-amber-500/15 text-amber-600',
  unpaid: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
  failed: 'bg-destructive/15 text-destructive',
  no_show: 'bg-destructive/15 text-destructive',
  refunded: 'bg-purple-500/15 text-purple-500',
}

function StatusPill({ status }: { status: string }) {
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs capitalize', PILL[status] ?? 'bg-muted text-muted-foreground')}>{status.replace(/_/g, ' ')}</span>
}
