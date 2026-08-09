import { Star, Quote } from 'lucide-react'
import { reviews as reviewFallback } from '@/lib/data'
import { db } from '@/lib/db/store'
import { Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'

export function Testimonials({
  limit = 6,
  className,
}: {
  limit?: number
  className?: string
}) {
  // Approved reviews from the store (featured first), falling back to seed data.
  const approved = db.reviews
    .filter((r) => r.approved)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.createdAt - a.createdAt)
  const reviews = approved.length ? approved : reviewFallback
  return (
    <Stagger
      className={cn(
        'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {reviews.slice(0, limit).map((r, i) => (
        <StaggerItem key={`${r.name}-${i}`}>
          <figure className="glass flex h-full flex-col gap-4 rounded-3xl p-6">
            <Quote className="size-7 text-primary/60" />
            <blockquote className="flex-1 text-pretty leading-relaxed text-foreground/90">
              {r.text}
            </blockquote>
            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-primary" />
              ))}
            </div>
            <figcaption className="flex flex-col border-t border-border/50 pt-4">
              <span className="font-medium text-foreground">{r.name}</span>
              <span className="text-sm text-muted-foreground">
                {r.country} · {r.trip}
              </span>
            </figcaption>
          </figure>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
