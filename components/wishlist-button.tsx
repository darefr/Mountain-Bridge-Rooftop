'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth/use-auth'
import { cn } from '@/lib/utils'
import type { WishlistItem, WishlistKind } from '@/lib/db/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Props = {
  kind: WishlistKind
  refId: string
  title: string
  image?: string
  href?: string
  meta?: string
  className?: string
  /** Show a compact icon-only button (default) or an icon + label pill. */
  withLabel?: boolean
}

export function WishlistButton({
  kind,
  refId,
  title,
  image,
  href,
  meta,
  className,
  withLabel = false,
}: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const { data, mutate } = useSWR<{ wishlist: WishlistItem[] }>(
    user ? '/api/account/wishlist' : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  const saved = (data?.wishlist ?? []).some((w) => w.kind === kind && w.refId === refId)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(href ?? '/account')}`)
      return
    }
    setBusy(true)
    if (saved) {
      await fetch(
        `/api/account/wishlist?kind=${encodeURIComponent(kind)}&refId=${encodeURIComponent(refId)}`,
        { method: 'DELETE' },
      )
    } else {
      await fetch('/api/account/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, refId, title, image, href, meta }),
      })
    }
    await mutate()
    setBusy(false)
  }

  const label = saved ? 'Saved' : 'Save'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={cn(
        'glass inline-flex items-center gap-1.5 rounded-full text-xs font-medium text-foreground/90 transition-colors hover:text-foreground disabled:opacity-60',
        withLabel ? 'px-3 py-1.5' : 'size-9 justify-center p-0',
        className,
      )}
    >
      <Heart className={cn('size-4', saved && 'fill-primary text-primary')} />
      {withLabel && <span>{label}</span>}
    </button>
  )
}
