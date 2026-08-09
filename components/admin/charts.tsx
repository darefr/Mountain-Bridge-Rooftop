'use client'

// Lightweight, dependency-free SVG charts tuned for the admin dashboard.
// Kept intentionally small so they can be lazy-loaded without pulling in a
// charting library. They read from CSS design tokens so they respect the
// premium light/dark theme.

import { useId } from 'react'

type Point = { label: string; value: number }

function niceMax(max: number) {
  if (max <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(max)))
  const n = max / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

// Smooth area/line chart for time series.
export function LineChart({
  data,
  height = 180,
  valuePrefix = '',
  color = 'var(--color-primary)',
}: {
  data: Point[]
  height?: number
  valuePrefix?: string
  color?: string
}) {
  const id = useId()
  const w = 640
  const h = height
  const pad = { top: 12, right: 8, bottom: 22, left: 8 }
  const innerW = w - pad.left - pad.right
  const innerH = h - pad.top - pad.bottom
  if (!data.length) return <EmptyChart height={height} />
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
  const x = (i: number) => pad.left + i * stepX
  const y = (v: number) => pad.top + innerH - (v / max) * innerH

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ')
  const area = `${line} L ${x(data.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`
  const showEvery = Math.ceil(data.length / 7)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Trend chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.left} x2={w - pad.right} y1={pad.top + innerH * g} y2={pad.top + innerH * g} stroke="var(--color-border)" strokeWidth="1" opacity="0.4" />
      ))}
      <path d={area} fill={`url(#grad-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) =>
        i % showEvery === 0 ? (
          <text key={i} x={x(i)} y={h - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

// Horizontal bar list — good for room popularity / distributions.
export function BarList({
  data,
  valuePrefix = '',
  valueSuffix = '',
}: {
  data: Point[]
  valuePrefix?: string
  valueSuffix?: string
}) {
  if (!data.length) return <EmptyChart height={120} />
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">
              {valuePrefix}
              {d.value.toLocaleString()}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/8">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Compact donut for status / method breakdowns.
export function Donut({
  data,
  size = 150,
}: {
  data: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <EmptyChart height={size} />
  const r = size / 2
  const stroke = size * 0.16
  const radius = r - stroke / 2
  const circ = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        {data.map((d) => {
          const frac = d.value / total
          const dash = frac * circ
          const seg = (
            <circle
              key={d.label}
              cx={r}
              cy={r}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return seg
        })}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="capitalize text-foreground">{d.label.replace(/_/g, ' ')}</span>
            <span className="text-muted-foreground">· {d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div className="grid place-items-center text-xs text-muted-foreground" style={{ height }}>
      No data for this range.
    </div>
  )
}

// A small palette used for categorical charts (donuts / distributions).
export const CHART_COLORS = [
  'var(--color-primary)',
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#a855f7',
  '#ef4444',
  '#64748b',
]
