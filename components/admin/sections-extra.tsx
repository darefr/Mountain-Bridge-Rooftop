'use client'

import { useMemo, useState } from 'react'
import {
  Mail, Archive, Reply, Trash2, Search, ShieldCheck, CalendarX2, Plus, Save, CheckCheck,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Act = (a: string, id?: string, p?: unknown) => Promise<any> | void

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-3xl p-5 ${className}`}>{children}</div>
}
const inp = 'w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60'

const CONTACT_STATUS: Record<string, string> = {
  new: 'bg-primary/15 text-primary',
  read: 'bg-blue-500/15 text-blue-500',
  replied: 'bg-success/15 text-success',
  archived: 'bg-muted text-muted-foreground',
}

/* -------------------- Contact messages -------------------- */
export function ContactMessages({ data, act }: { data: any; act: Act }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState<any | null>(null)

  const list = useMemo(() => {
    let m: any[] = [...(data.contactMessages ?? [])]
    if (q.trim()) {
      const s = q.toLowerCase()
      m = m.filter((x) => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s) || (x.message || '').toLowerCase().includes(s))
    }
    if (status !== 'all') m = m.filter((x) => x.status === status)
    return m
  }, [data.contactMessages, q, status])

  const current = open ? (data.contactMessages ?? []).find((x: any) => x.id === open.id) ?? open : null

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-xl text-foreground"><Mail className="size-5 text-primary" /> Contact messages <span className="text-sm text-muted-foreground">({list.length})</span></h3>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, message…" className="w-full rounded-xl border border-border/70 bg-background/40 py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary/60" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-xs capitalize text-foreground outline-none">
          {['all', 'new', 'read', 'replied', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {list.map((m) => (
          <button key={m.id} onClick={() => { setOpen(m); if (m.status === 'new') act('contact.setStatus', m.id, { status: 'read' }) }} className="glass flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{m.name} <span className="text-xs text-muted-foreground">· {m.subject || 'No subject'}</span></p>
              <p className="truncate text-xs text-muted-foreground">{m.message}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize', CONTACT_STATUS[m.status])}>{m.status}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">{formatDate(m.createdAt)}</span>
            </div>
          </button>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-muted-foreground">No messages.</p>}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="glass-strong w-full max-w-lg rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="font-serif text-xl text-foreground">{current.name}</h4>
                <p className="text-sm text-muted-foreground">{current.email}{current.phone ? ` · ${current.phone}` : ''}</p>
              </div>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize', CONTACT_STATUS[current.status])}>{current.status}</span>
            </div>
            {current.subject && <p className="mb-1 text-sm font-medium text-foreground">{current.subject}</p>}
            <p className="whitespace-pre-wrap rounded-2xl bg-foreground/5 p-4 text-sm text-foreground">{current.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">Received {formatDateTime(current.createdAt)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`mailto:${current.email}?subject=${encodeURIComponent('Re: ' + (current.subject || 'Your enquiry'))}`} onClick={() => act('contact.setStatus', current.id, { status: 'replied' })} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"><Reply className="size-4" /> Reply by email</a>
              <button onClick={() => act('contact.setStatus', current.id, { status: 'archived' })} className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs text-foreground"><Archive className="size-4" /> Archive</button>
              <button onClick={() => { act('contact.remove', current.id); setOpen(null) }} className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-4 py-2 text-xs text-destructive"><Trash2 className="size-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/* -------------------- Audit log -------------------- */
export function AuditLog({ data }: { data: any }) {
  const logs: any[] = data.auditLogs ?? []
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 font-serif text-xl text-foreground"><ShieldCheck className="size-5 text-primary" /> Audit log</h3>
      {!logs.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No audit entries yet, or you lack permission to view them.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                {['When', 'User', 'Action', 'Target', 'Detail'].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border/40">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</td>
                  <td className="py-2 pr-3">{l.userName}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-primary">{l.action}</td>
                  <td className="py-2 pr-3 text-xs">{l.target || '—'}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{l.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* -------------------- Availability blocking -------------------- */
const REASONS = ['maintenance', 'private_booking', 'closure', 'other']
export function Availability({ data, act }: { data: any; act: Act }) {
  const rooms: any[] = data.rooms ?? []
  const blocks: any[] = data.roomBlocks ?? []
  const [form, setForm] = useState({ roomSlug: rooms[0]?.slug ?? '', units: '1', start: '', end: '', reason: 'maintenance', note: '' })

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-serif text-xl text-foreground"><CalendarX2 className="size-5 text-primary" /> Block inventory</h3>
        <p className="mb-4 text-sm text-muted-foreground">Blocked units are removed from customer availability for the selected dates.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-muted-foreground">Room
            <select className={inp} value={form.roomSlug} onChange={(e) => setForm({ ...form, roomSlug: e.target.value })}>
              {rooms.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Units
            <input type="number" min="1" className={inp} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">Reason
            <select className={inp} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              {REASONS.map((r) => <option key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">From
            <input type="date" className={inp} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">To
            <input type="date" className={inp} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </label>
          <label className="text-xs text-muted-foreground">Note
            <input className={inp} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
          </label>
        </div>
        <button onClick={() => { if (form.roomSlug && form.start && form.end) act('roomBlock.create', undefined, { ...form, units: Number(form.units) }) }} className="mt-3 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="size-4" /> Add block</button>
      </Card>

      <Card>
        <h3 className="mb-4 font-serif text-lg text-foreground">Active & upcoming blocks</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                {['Room', 'Units', 'Period', 'Reason', 'Note', ''].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => {
                const room = rooms.find((r) => r.slug === b.roomSlug)
                return (
                  <tr key={b.id} className="border-t border-border/40">
                    <td className="py-2 pr-3">{room?.name ?? b.roomSlug}</td>
                    <td className="py-2 pr-3">{b.units}</td>
                    <td className="py-2 pr-3 text-xs">{b.start} → {b.end}</td>
                    <td className="py-2 pr-3 capitalize">{b.reason.replace(/_/g, ' ')}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{b.note || '—'}</td>
                    <td className="py-2 pr-3"><button onClick={() => act('roomBlock.remove', b.id)} className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive">Remove</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!blocks.length && <p className="py-6 text-center text-sm text-muted-foreground">No inventory blocks.</p>}
      </Card>
    </div>
  )
}

/* -------------------- Settings / CMS -------------------- */
export function Settings({ data, act }: { data: any; act: Act }) {
  const s = data.settings
  const [form, setForm] = useState<any>(() => ({ ...s, social: { ...s?.social }, hero: { ...s?.hero } }))
  const [saved, setSaved] = useState(false)
  if (!s) return <Card><p className="text-sm text-muted-foreground">You need manager access to edit settings.</p></Card>

  async function save() {
    await act('settings.update', undefined, {
      hotelName: form.hotelName, description: form.description, phone: form.phone, email: form.email,
      address: form.address, whatsapp: form.whatsapp, mapsLink: form.mapsLink,
      checkInTime: form.checkInTime, checkOutTime: form.checkOutTime, restaurantHours: form.restaurantHours,
      social: form.social, hero: form.hero,
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const F = ({ k, label, ph }: { k: string; label: string; ph?: string }) => (
    <label className="text-xs text-muted-foreground">{label}
      <input className={inp} value={form[k] ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </label>
  )

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-serif text-xl text-foreground">Hotel information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <F k="hotelName" label="Hotel name" />
          <F k="email" label="Email" />
          <F k="phone" label="Phone" />
          <F k="whatsapp" label="WhatsApp" />
          <F k="address" label="Address" />
          <F k="mapsLink" label="Google Maps link" />
          <F k="checkInTime" label="Check-in time" ph="13:00" />
          <F k="checkOutTime" label="Check-out time" ph="11:00" />
          <F k="restaurantHours" label="Restaurant hours" />
        </div>
        <label className="mt-3 block text-xs text-muted-foreground">Description
          <textarea rows={3} className={inp} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
      </Card>

      <Card>
        <h3 className="mb-4 font-serif text-lg text-foreground">Homepage hero</h3>
        <div className="grid gap-3">
          <label className="text-xs text-muted-foreground">Hero title
            <input className={inp} value={form.hero?.title ?? ''} onChange={(e) => setForm({ ...form, hero: { ...form.hero, title: e.target.value } })} />
          </label>
          <label className="text-xs text-muted-foreground">Hero subtitle
            <input className={inp} value={form.hero?.subtitle ?? ''} onChange={(e) => setForm({ ...form, hero: { ...form.hero, subtitle: e.target.value } })} />
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-serif text-lg text-foreground">Social links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {['facebook', 'instagram', 'tripadvisor', 'youtube'].map((soc) => (
            <label key={soc} className="text-xs capitalize text-muted-foreground">{soc}
              <input className={inp} value={form.social?.[soc] ?? ''} onChange={(e) => setForm({ ...form, social: { ...form.social, [soc]: e.target.value } })} />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 font-serif text-lg text-foreground">Email configuration</h3>
        <p className="text-sm text-muted-foreground">
          Status:{' '}
          {data.emailConfigured
            ? <span className="text-success">Configured</span>
            : <span className="text-amber-500">Not configured — set SMTP env vars to enable transactional email.</span>}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">SMTP credentials are never displayed here for security.</p>
      </Card>

      <EmailTemplates data={data} act={act} />

      <div className="flex items-center gap-3">
        <button onClick={save} className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"><Save className="size-4" /> Save settings</button>
        {saved && <span className="flex items-center gap-1 text-sm text-success"><CheckCheck className="size-4" /> Saved</span>}
      </div>
    </div>
  )
}

function EmailTemplates({ data, act }: { data: any; act: Act }) {
  const templates: any[] = data.settings?.emailTemplates ?? []
  const [edited, setEdited] = useState<Record<string, { subject: string; body: string }>>({})

  return (
    <Card>
      <h3 className="mb-4 font-serif text-lg text-foreground">Email templates</h3>
      <div className="space-y-4">
        {templates.map((t) => {
          const cur = edited[t.id] ?? { subject: t.subject, body: t.body }
          return (
            <div key={t.id} className="rounded-2xl border border-border/40 p-4">
              <p className="mb-2 text-sm font-medium text-foreground">{t.name}</p>
              <input className={inp} value={cur.subject} onChange={(e) => setEdited({ ...edited, [t.id]: { ...cur, subject: e.target.value } })} placeholder="Subject" />
              <textarea rows={4} className={cn(inp, 'mt-2 font-mono text-xs')} value={cur.body} onChange={(e) => setEdited({ ...edited, [t.id]: { ...cur, body: e.target.value } })} />
              <button onClick={() => act('emailTemplate.update', t.id, cur)} className="mt-2 rounded-full bg-muted px-4 py-1.5 text-xs text-foreground">Save template</button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
