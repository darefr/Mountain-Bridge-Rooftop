'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, TrendingUp, Download } from 'lucide-react'
import { LineChart, BarList, Donut, CHART_COLORS } from './charts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Range = 'today' | '7d' | '30d' | 'month' | 'year' | 'custom'

const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-3xl p-5 ${className}`}>{children}</div>
}

export function AnalyticsSection() {
  const [range, setRange] = useState<Range>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const qs =
    range === 'custom'
      ? `?range=custom&from=${from}&to=${to}`
      : `?range=${range}`
  const { data, isLoading } = useSWR(`/api/admin/analytics${qs}`, fetcher, { keepPreviousData: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-xl text-foreground">
          <TrendingUp className="size-5 text-primary" /> Analytics
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass flex flex-wrap gap-1 rounded-full p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  range === r.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {range === 'custom' && (
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground outline-none" />
          </label>
        </Card>
      )}

      {isLoading && !data ? (
        <div className="grid min-h-[30vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : !data || data.error ? (
        <Card><p className="text-sm text-muted-foreground">Unable to load analytics.</p></Card>
      ) : (
        <>
          {/* Revenue KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Total revenue" value={`$${data.revenue.total.toLocaleString()}`} accent />
            <Kpi label="Paid" value={`$${data.revenue.paid.toLocaleString()}`} />
            <Kpi label="Pending" value={`$${data.revenue.pending.toLocaleString()}`} tone="text-amber-500" />
            <Kpi label="Refunded" value={`$${data.revenue.refunded.toLocaleString()}`} tone="text-destructive" />
            <Kpi label="Avg booking" value={`$${data.revenue.avgBookingValue.toLocaleString()}`} />
          </div>

          {/* Booking KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <MiniKpi label="Bookings" value={data.bookings.total} />
            <MiniKpi label="Confirmed" value={data.bookings.confirmed} tone="text-success" />
            <MiniKpi label="Pending" value={data.bookings.pending} tone="text-amber-500" />
            <MiniKpi label="Cancelled" value={data.bookings.cancelled} tone="text-destructive" />
            <MiniKpi label="Completed" value={data.bookings.completed} />
            <MiniKpi label="Payment due" value={data.bookings.paymentPending} tone="text-amber-500" />
          </div>

          {/* Time series */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h4 className="mb-3 font-medium text-foreground">Revenue over time</h4>
              <LineChart data={data.series.map((s: any) => ({ label: fmtDay(s.date), value: s.revenue }))} valuePrefix="$" />
            </Card>
            <Card>
              <h4 className="mb-3 font-medium text-foreground">Bookings over time</h4>
              <LineChart data={data.series.map((s: any) => ({ label: fmtDay(s.date), value: s.bookings }))} color="#0ea5e9" />
            </Card>
          </div>

          {/* Distributions */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <h4 className="mb-3 font-medium text-foreground">Room popularity</h4>
              <BarList data={data.roomPopularity.map((r: any) => ({ label: r.name, value: r.bookings }))} />
            </Card>
            <Card>
              <h4 className="mb-4 font-medium text-foreground">Payment methods</h4>
              <Donut
                data={data.paymentMethods.map((m: any, i: number) => ({ label: m.method, value: m.count, color: CHART_COLORS[i % CHART_COLORS.length] }))}
              />
            </Card>
            <Card>
              <h4 className="mb-4 font-medium text-foreground">Booking source</h4>
              <Donut
                data={data.sources.map((s: any, i: number) => ({ label: s.source, value: s.count, color: CHART_COLORS[(i + 2) % CHART_COLORS.length] }))}
              />
            </Card>
          </div>

          {/* Occupancy */}
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium text-foreground">Occupancy — {data.occupancy.rate}%</h4>
              <p className="text-xs text-muted-foreground">{data.occupancy.soldNights} / {data.occupancy.capacity} room-nights</p>
            </div>
            <BarList data={data.occupancy.perRoom.map((r: any) => ({ label: r.name, value: r.rate }))} valueSuffix="%" />
          </Card>

          <div className="flex flex-wrap gap-2">
            <ExportBtn type="revenue" label="Export revenue CSV" />
            <ExportBtn type="bookings" label="Export bookings CSV" />
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: string }) {
  return (
    <Card className={accent ? 'ring-1 ring-primary/25' : ''}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-serif text-3xl ${tone ?? 'text-foreground'}`}>{value}</p>
    </Card>
  )
}

function MiniKpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="glass-strong rounded-2xl p-4">
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${tone ?? 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function ExportBtn({ type, label }: { type: string; label: string }) {
  return (
    <a
      href={`/api/admin/export?type=${type}`}
      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      <Download className="size-4" /> {label}
    </a>
  )
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
