'use client'

import { useState } from 'react'
import {
  Plus, Trash2, Save, CheckCheck, ArrowUp, ArrowDown, Star, Eye, EyeOff, Image as ImageIconLucide,
  HelpCircle, Building2, Search as SearchIcon, UtensilsCrossed, Globe, Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageUpload } from './image-upload'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Act = (a: string, id?: string, p?: unknown) => Promise<any> | void

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass-strong rounded-3xl p-4 sm:p-5', className)}>{children}</div>
}
const inp = 'w-full rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60'

const GALLERY_CATEGORIES = [
  'Rooms', 'Restaurant', 'Rooftop', 'Hotel', 'Mountain', 'Exterior', 'Interior', 'Trekking', 'Events', 'Experiences', 'Other',
]

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input type={type} className={cn(inp, 'mt-1')} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <textarea className={cn(inp, 'mt-1')} rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

/* ==================== GALLERY MANAGER ==================== */
export function GalleryManager({ data, act }: { data: any; act: Act }) {
  const items: any[] = data.gallery ?? []
  const [filter, setFilter] = useState('All')
  const [adding, setAdding] = useState(false)
  const [nf, setNf] = useState<any>({ src: '', title: '', description: '', alt: '', category: 'Rooms', featured: false })

  const filtered = filter === 'All' ? items : items.filter((g) => g.category === filter)

  async function move(idx: number, dir: number) {
    const order = [...items]
    const j = idx + dir
    if (j < 0 || j >= order.length) return
    ;[order[idx], order[j]] = [order[j], order[idx]]
    await act('gallery.reorder', undefined, { ids: order.map((g) => g.id) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-xl text-foreground"><ImageIconLucide className="size-5 text-primary" /> Gallery <span className="text-sm text-muted-foreground">({items.length})</span></h3>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="size-4" /> Add image
        </button>
      </div>

      {adding && (
        <Card>
          <h4 className="mb-3 font-medium text-foreground">New gallery image</h4>
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <ImageUpload value={nf.src} onChange={(src) => setNf({ ...nf, src })} label="Image" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Title" value={nf.title} onChange={(v) => setNf({ ...nf, title: v })} />
              <Field label="Alt text (accessibility)" value={nf.alt} onChange={(v) => setNf({ ...nf, alt: v })} placeholder="Describe the image" />
              <label className="block text-xs text-muted-foreground">Category
                <select className={cn(inp, 'mt-1')} value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })}>
                  {GALLERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={nf.featured} onChange={(e) => setNf({ ...nf, featured: e.target.checked })} className="size-4 accent-[var(--color-primary)]" /> Featured
              </label>
              <div className="sm:col-span-2">
                <TextArea label="Description" value={nf.description} rows={2} onChange={(v) => setNf({ ...nf, description: v })} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={!nf.src}
              onClick={() => { act('gallery.create', undefined, nf); setNf({ src: '', title: '', description: '', alt: '', category: 'Rooms', featured: false }); setAdding(false) }}
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >Add to gallery</button>
            <button onClick={() => setAdding(false)} className="rounded-full bg-muted px-4 py-2 text-sm text-foreground">Cancel</button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {['All', ...GALLERY_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn('rounded-full px-3 py-1.5 text-xs transition-colors', filter === c ? 'bg-primary text-primary-foreground' : 'glass text-foreground/80')}>{c}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => {
          const idx = items.findIndex((x) => x.id === g.id)
          return (
            <Card key={g.id} className={cn(!g.enabled && 'opacity-60')}>
              <div className="relative overflow-hidden rounded-2xl border border-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src || '/placeholder.svg'} alt={g.alt} className="aspect-video w-full object-cover" />
                {g.featured && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-medium text-primary-foreground"><Star className="size-3" /> Featured</span>}
              </div>
              <div className="mt-3 space-y-2">
                <Field label="Title" value={g.title} onChange={(v) => act('gallery.update', g.id, { title: v })} />
                <Field label="Alt text" value={g.alt} onChange={(v) => act('gallery.update', g.id, { alt: v })} />
                <label className="block text-xs text-muted-foreground">Category
                  <select className={cn(inp, 'mt-1')} value={g.category} onChange={(e) => act('gallery.update', g.id, { category: e.target.value })}>
                    {GALLERY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
                <button onClick={() => act('gallery.update', g.id, { featured: !g.featured })} className={cn('rounded-full px-2.5 py-1 text-xs', g.featured ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground')}>{g.featured ? 'Unfeature' : 'Feature'}</button>
                <button onClick={() => act('gallery.toggle', g.id)} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{g.enabled ? <><EyeOff className="size-3" /> Hide</> : <><Eye className="size-3" /> Show</>}</button>
                <button onClick={() => move(idx, -1)} className="grid size-7 place-items-center rounded-full bg-muted text-foreground" title="Move up"><ArrowUp className="size-3.5" /></button>
                <button onClick={() => move(idx, 1)} className="grid size-7 place-items-center rounded-full bg-muted text-foreground" title="Move down"><ArrowDown className="size-3.5" /></button>
                <button onClick={() => { if (confirm('Delete this image?')) act('gallery.remove', g.id) }} className="ml-auto grid size-7 place-items-center rounded-full bg-destructive/15 text-destructive" title="Delete"><Trash2 className="size-3.5" /></button>
              </div>
            </Card>
          )
        })}
      </div>
      {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No images in this category.</p>}
    </div>
  )
}

/* ==================== FAQ MANAGER ==================== */
export function FaqManager({ data, act }: { data: any; act: Act }) {
  const items: any[] = data.faqs ?? []
  const [adding, setAdding] = useState(false)
  const [nf, setNf] = useState({ question: '', answer: '', category: 'General' })
  const [editing, setEditing] = useState<Record<string, any>>({})

  async function move(idx: number, dir: number) {
    const order = [...items]
    const j = idx + dir
    if (j < 0 || j >= order.length) return
    ;[order[idx], order[j]] = [order[j], order[idx]]
    await act('faq.reorder', undefined, { ids: order.map((f) => f.id) })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-xl text-foreground"><HelpCircle className="size-5 text-primary" /> FAQ <span className="text-sm text-muted-foreground">({items.length})</span></h3>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="size-4" /> Add question</button>
      </div>

      {adding && (
        <Card>
          <div className="grid gap-2">
            <Field label="Question" value={nf.question} onChange={(v) => setNf({ ...nf, question: v })} />
            <Field label="Category" value={nf.category} onChange={(v) => setNf({ ...nf, category: v })} placeholder="e.g. Staying & booking" />
            <TextArea label="Answer" value={nf.answer} rows={3} onChange={(v) => setNf({ ...nf, answer: v })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button disabled={!nf.question || !nf.answer} onClick={() => { act('faq.create', undefined, nf); setNf({ question: '', answer: '', category: 'General' }); setAdding(false) }} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Add FAQ</button>
            <button onClick={() => setAdding(false)} className="rounded-full bg-muted px-4 py-2 text-sm text-foreground">Cancel</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((f, idx) => {
          const cur = editing[f.id] ?? { question: f.question, answer: f.answer, category: f.category }
          const dirty = cur.question !== f.question || cur.answer !== f.answer || cur.category !== f.category
          return (
            <Card key={f.id} className={cn(!f.active && 'opacity-60')}>
              <div className="grid gap-2">
                <Field label="Question" value={cur.question} onChange={(v) => setEditing({ ...editing, [f.id]: { ...cur, question: v } })} />
                <Field label="Category" value={cur.category} onChange={(v) => setEditing({ ...editing, [f.id]: { ...cur, category: v } })} />
                <TextArea label="Answer" value={cur.answer} rows={3} onChange={(v) => setEditing({ ...editing, [f.id]: { ...cur, answer: v } })} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
                {dirty && <button onClick={() => act('faq.update', f.id, cur)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"><Save className="size-3.5" /> Save</button>}
                <button onClick={() => act('faq.toggle', f.id)} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground">{f.active ? <><EyeOff className="size-3" /> Hide</> : <><Eye className="size-3" /> Show</>}</button>
                <button onClick={() => move(idx, -1)} className="grid size-7 place-items-center rounded-full bg-muted text-foreground" title="Move up"><ArrowUp className="size-3.5" /></button>
                <button onClick={() => move(idx, 1)} className="grid size-7 place-items-center rounded-full bg-muted text-foreground" title="Move down"><ArrowDown className="size-3.5" /></button>
                <button onClick={() => { if (confirm('Delete this FAQ?')) act('faq.remove', f.id) }} className="ml-auto grid size-7 place-items-center rounded-full bg-destructive/15 text-destructive" title="Delete"><Trash2 className="size-3.5" /></button>
              </div>
            </Card>
          )
        })}
      </div>
      {!items.length && <p className="py-8 text-center text-sm text-muted-foreground">No FAQs yet.</p>}
    </div>
  )
}

/* ==================== SETTINGS / CMS ==================== */
export function SettingsCMS({ data, act }: { data: any; act: Act }) {
  const s = data.settings
  const [form, setForm] = useState<any>(() => ({
    ...s,
    social: { ...s?.social },
    hero: { ...s?.hero },
    restaurant: { ...s?.restaurant, images: [...(s?.restaurant?.images ?? [])] },
    seo: { ...s?.seo },
  }))
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'general' | 'hero' | 'restaurant' | 'social' | 'seo' | 'email'>('general')
  if (!s) return <Card><p className="text-sm text-muted-foreground">You need manager access to edit settings.</p></Card>

  const set = (k: string, v: any) => setForm({ ...form, [k]: v })
  const setNested = (group: string, k: string, v: any) => setForm({ ...form, [group]: { ...form[group], [k]: v } })

  async function save() {
    await act('settings.update', undefined, {
      hotelName: form.hotelName, shortName: form.shortName, websiteTitle: form.websiteTitle, tagline: form.tagline,
      description: form.description, phone: form.phone, email: form.email, address: form.address,
      whatsapp: form.whatsapp, mapsLink: form.mapsLink, websiteUrl: form.websiteUrl,
      checkInTime: form.checkInTime, checkOutTime: form.checkOutTime, restaurantHours: form.restaurantHours,
      currency: form.currency, taxRatePct: Number(form.taxRatePct), footerText: form.footerText,
      social: form.social, hero: form.hero, restaurant: form.restaurant, seo: form.seo,
    })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'hero', label: 'Homepage', icon: Globe },
    { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
    { id: 'email', label: 'Email', icon: HelpCircle },
  ] as const

  return (
    <div className="space-y-4">
      {/* sticky save bar */}
      <div className="sticky top-20 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-background/80 p-2 backdrop-blur">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors', tab === tb.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/5')}>
              <tb.icon className="size-3.5" /> {tb.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-xs text-success"><CheckCheck className="size-4" /> Saved</span>}
          <button onClick={save} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Save className="size-4" /> Save</button>
        </div>
      </div>

      {tab === 'general' && (
        <Card>
          <h3 className="mb-4 font-serif text-lg text-foreground">General settings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Hotel name (full)" value={form.hotelName} onChange={(v) => set('hotelName', v)} />
            <Field label="Short name" value={form.shortName} onChange={(v) => set('shortName', v)} />
            <Field label="Website title" value={form.websiteTitle} onChange={(v) => set('websiteTitle', v)} />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set('tagline', v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field label="WhatsApp number" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} />
            <Field label="Email" value={form.email} onChange={(v) => set('email', v)} />
            <Field label="Website URL" value={form.websiteUrl} onChange={(v) => set('websiteUrl', v)} />
            <Field label="Address" value={form.address} onChange={(v) => set('address', v)} />
            <Field label="Google Maps URL" value={form.mapsLink} onChange={(v) => set('mapsLink', v)} />
            <Field label="Check-in time" value={form.checkInTime} onChange={(v) => set('checkInTime', v)} placeholder="13:00" />
            <Field label="Check-out time" value={form.checkOutTime} onChange={(v) => set('checkOutTime', v)} placeholder="11:00" />
            <label className="block text-xs text-muted-foreground">Currency
              <select className={cn(inp, 'mt-1')} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="NPR">NPR (Rs)</option>
              </select>
            </label>
            <Field label="Tax rate (%)" type="number" value={String(form.taxRatePct ?? '')} onChange={(v) => set('taxRatePct', v)} />
          </div>
          <div className="mt-3 grid gap-3">
            <TextArea label="Description" value={form.description} onChange={(v) => set('description', v)} />
            <TextArea label="Footer text" value={form.footerText} rows={2} onChange={(v) => set('footerText', v)} />
          </div>
        </Card>
      )}

      {tab === 'hero' && (
        <Card>
          <h3 className="mb-4 font-serif text-lg text-foreground">Homepage / Hero</h3>
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <ImageUpload value={form.hero.image} onChange={(v) => setNested('hero', 'image', v)} label="Hero image" />
              <Field label="Hero video URL (optional)" value={form.hero.video ?? ''} onChange={(v) => setNested('hero', 'video', v)} placeholder="https://…/hero.mp4" />
            </div>
            <div className="grid gap-3">
              <Field label="Hero title" value={form.hero.title} onChange={(v) => setNested('hero', 'title', v)} />
              <Field label="Hero subtitle" value={form.hero.subtitle} onChange={(v) => setNested('hero', 'subtitle', v)} />
              <TextArea label="Hero description" value={form.hero.description ?? ''} rows={2} onChange={(v) => setNested('hero', 'description', v)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary CTA text" value={form.hero.ctaText ?? ''} onChange={(v) => setNested('hero', 'ctaText', v)} />
                <Field label="Primary CTA link" value={form.hero.ctaLink ?? ''} onChange={(v) => setNested('hero', 'ctaLink', v)} />
                <Field label="Secondary CTA text" value={form.hero.secondaryCtaText ?? ''} onChange={(v) => setNested('hero', 'secondaryCtaText', v)} />
                <Field label="Secondary CTA link" value={form.hero.secondaryCtaLink ?? ''} onChange={(v) => setNested('hero', 'secondaryCtaLink', v)} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-2">
            <Field label="Featured section title" value={form.hero.featuredTitle ?? ''} onChange={(v) => setNested('hero', 'featuredTitle', v)} />
            <Field label="Featured section description" value={form.hero.featuredDescription ?? ''} onChange={(v) => setNested('hero', 'featuredDescription', v)} />
          </div>
        </Card>
      )}

      {tab === 'restaurant' && (
        <Card>
          <h3 className="mb-4 font-serif text-lg text-foreground">Restaurant</h3>
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <ImageUpload value={form.restaurant.image} onChange={(v) => setNested('restaurant', 'image', v)} label="Featured image" />
            <div className="grid gap-3">
              <Field label="Restaurant name" value={form.restaurant.name} onChange={(v) => setNested('restaurant', 'name', v)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Opening hours" value={form.restaurant.hours} onChange={(v) => setNested('restaurant', 'hours', v)} />
                <Field label="Phone" value={form.restaurant.phone} onChange={(v) => setNested('restaurant', 'phone', v)} />
              </div>
              <Field label="Email" value={form.restaurant.email} onChange={(v) => setNested('restaurant', 'email', v)} />
              <TextArea label="Description" value={form.restaurant.description} onChange={(v) => setNested('restaurant', 'description', v)} />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.restaurant.active} onChange={(e) => setNested('restaurant', 'active', e.target.checked)} className="size-4 accent-[var(--color-primary)]" /> Restaurant active / visible
              </label>
            </div>
          </div>
        </Card>
      )}

      {tab === 'social' && (
        <Card>
          <h3 className="mb-4 font-serif text-lg text-foreground">Social links</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {['facebook', 'instagram', 'tripadvisor', 'youtube'].map((soc) => (
              <Field key={soc} label={soc[0].toUpperCase() + soc.slice(1)} value={form.social?.[soc] ?? ''} onChange={(v) => setNested('social', soc, v)} placeholder={`https://…`} />
            ))}
          </div>
        </Card>
      )}

      {tab === 'seo' && (
        <Card>
          <h3 className="mb-4 font-serif text-lg text-foreground">SEO & social sharing</h3>
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <ImageUpload value={form.seo.ogImage} onChange={(v) => setNested('seo', 'ogImage', v)} label="Open Graph image" />
              <ImageUpload value={form.seo.twitterImage} onChange={(v) => setNested('seo', 'twitterImage', v)} label="Twitter/X image" />
            </div>
            <div className="grid gap-3">
              <Field label="Meta title" value={form.seo.metaTitle} onChange={(v) => setNested('seo', 'metaTitle', v)} />
              <TextArea label="Meta description" value={form.seo.metaDescription} rows={2} onChange={(v) => setNested('seo', 'metaDescription', v)} />
              <TextArea label="Keywords (comma separated)" value={form.seo.keywords} rows={2} onChange={(v) => setNested('seo', 'keywords', v)} />
              <Field label="OG title" value={form.seo.ogTitle} onChange={(v) => setNested('seo', 'ogTitle', v)} />
              <TextArea label="OG description" value={form.seo.ogDescription} rows={2} onChange={(v) => setNested('seo', 'ogDescription', v)} />
              <Field label="Canonical URL" value={form.seo.canonicalUrl} onChange={(v) => setNested('seo', 'canonicalUrl', v)} />
            </div>
          </div>
        </Card>
      )}

      {tab === 'email' && (
        <div className="space-y-4">
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
        </div>
      )}
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
