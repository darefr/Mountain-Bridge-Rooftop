import Image from 'next/image'
import { ArrowRight, Users, Maximize, BedDouble } from 'lucide-react'
import type { Room } from '@/lib/data'
import { LuxLink } from '@/components/ui/lux-button'
import { WishlistButton } from '@/components/wishlist-button'

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={room.image || '/placeholder.svg'}
          alt={room.name}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-foreground">
          {room.price}
        </span>
        <WishlistButton
          kind="room"
          refId={room.slug}
          title={room.name}
          image={room.image}
          href="/rooms"
          meta={room.price}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-2xl text-foreground">{room.name}</h3>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {room.blurb}
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Maximize className="size-3.5 text-primary" /> {room.size}
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" /> {room.guests}
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-3.5 text-primary" /> {room.bed}
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
          <LuxLink
            href="/rooms"
            variant="ghost"
            size="sm"
            shimmer={false}
            className="px-0 text-primary"
          >
            View details
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </LuxLink>
          <LuxLink href="/rooms" variant="luxury" size="sm">
            Book
          </LuxLink>
        </div>
      </div>
    </article>
  )
}
