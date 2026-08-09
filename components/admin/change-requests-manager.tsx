'use client'

import { useMemo, useState } from 'react'
import { Check, X, Loader2, ArrowRight, ClipboardList } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BookingChangeRequest } from '@/lib/db/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Filter = 'pending' | 'all'

const statusStyle: Record<string, string> = {
  pending: 'bg-primary/15 text-primary',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
}

const typeLabel: Record<string, string> = {
  dates: 'Date change',
  room: 'Room change',
  guests: 'Guest count',
  other: 'Other request',
}

export function ChangeRequestsManager({
  data,
  act,
}: {
  data: any
  act: (action: string, id?: string, payload?: unknown) => Promise<any> | void
}) {
  const requests: BookingChangeRequest[] = data.changeRequests ?? []
  const [filter, setFilter] = useState<Filter>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const list = useMemo(() => {
    if (filter === 'pending') return requests.filter((r) => r.status === 'pending')
    return requests
  }, [requests, filter])

  async function resolve(id: string, action: 'changeRequest.approve' | 'changeRequest.reject') {
    setBusyId(id)
    await act(action, id, { note: notes[id]?.trim() || undefined })
    setBusyId(null)
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
          <ClipboardList className="size-5 text-primary" />
          Change requests
          {pendingCount > 0 && (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {pendingCount}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {(['pending', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs capitalize transition-colors',
                filter === f ? 'bg-primary text-primary-foreground' : 'glass text-foreground/80 hover:text-foreground',
              )}
            >
              {f} ({f === 'pending' ? pendingCount : requests.length})
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <div className="glass-strong rounded-3xl p-10 text-center text-muted-foreground">
          No {filter === 'pending' ? 'pending ' : ''}change requests.
        </div>
      ) : (
        list.map((r) => (
          <div key={r.id} className="glass-strong rounded-3xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground">
                    {typeLabel[r.type] ?? r.type}
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary">{r.bookingRef}</span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusStyle[r.status])}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Requested {formatDateTime(r.createdAt)}
                </p>
              </div>
            </div>

            {/* Requested change summary */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {r.type === 'dates' && (
                <Change
                  label="Dates"
                  from={`${formatDate(r.fromCheckIn ?? '')} → ${formatDate(r.fromCheckOut ?? '')}`}
                  to={`${formatDate(r.checkIn ?? '')} → ${formatDate(r.checkOut ?? '')}`}
                />
              )}
              {r.type === 'room' && (
                <Change label="Room" from={r.fromRoomName ?? r.fromRoomSlug ?? ''} to={r.roomName ?? r.roomSlug ?? ''} />
              )}
              {r.type === 'guests' && (
                <Change label="Guests" from={String(r.fromGuests ?? '')} to={String(r.guests ?? '')} />
              )}
              {r.message && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Message</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{r.message}</p>
                </div>
              )}
            </div>

            {r.status === 'pending' ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={notes[r.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Optional note to the guest…"
                  className="flex-1 rounded-full border border-border/70 bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-primary/60"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(r.id, 'changeRequest.approve')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/25 disabled:opacity-60"
                  >
                    {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'changeRequest.reject')}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-60"
                  >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              (r.adminNote || r.resolvedBy) && (
                <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {r.resolvedBy && <span>Resolved by {r.resolvedBy}. </span>}
                  {r.adminNote && <span>Note: {r.adminNote}</span>}
                </div>
              )
            )}
          </div>
        ))
      )}
    </div>
  )
}

function Change({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span className="text-muted-foreground line-through">{from}</span>
        <ArrowRight className="size-3.5 text-primary" />
        <span className="font-medium">{to}</span>
      </p>
    </div>
  )
}
