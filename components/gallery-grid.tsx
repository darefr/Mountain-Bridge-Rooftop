'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { galleryImages } from '@/lib/data'
import { cn } from '@/lib/utils'

type GalleryImg = { src: string; alt: string; cat: string }

const fallback: GalleryImg[] = galleryImages

export function GalleryGrid({ images, categories: cats }: { images?: GalleryImg[]; categories?: string[] }) {
  const source = images && images.length ? images : fallback
  const categories = ['All', ...(cats && cats.length ? cats : Array.from(new Set(source.map((i) => i.cat))))]
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState<number | null>(null)

  const filtered = source.filter(
    (img) => filter === 'All' || img.cat === filter,
  )

  function move(dir: number) {
    if (active === null) return
    const next = (active + dir + filtered.length) % filtered.length
    setActive(next)
  }

  return (
    <div className="flex flex-col gap-10">
      {/* filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              'rounded-full px-4 py-2 text-sm transition-all',
              filter === c
                ? 'bg-primary text-primary-foreground'
                : 'glass text-foreground/80 hover:text-foreground',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* masonry */}
      <motion.div layout className="columns-2 gap-4 md:columns-3 lg:columns-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((img, i) => (
            <motion.button
              layout
              key={img.src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onClick={() => setActive(i)}
              className="group relative mb-4 block w-full overflow-hidden rounded-2xl"
            >
              <Image
                src={img.src || '/placeholder.svg'}
                alt={img.alt}
                width={600}
                height={800}
                sizes="(max-width: 768px) 50vw, 25vw"
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 translate-y-2 text-sm text-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                {img.alt}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4 backdrop-blur-xl"
            onClick={() => setActive(null)}
          >
            <button
              className="glass absolute right-4 top-4 grid size-11 place-items-center rounded-full text-foreground"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <button
              className="glass absolute left-4 grid size-11 place-items-center rounded-full text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                move(-1)
              }}
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              className="glass absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                move(1)
              }}
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative max-h-[85vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filtered[active].src || '/placeholder.svg'}
                alt={filtered[active].alt}
                width={1200}
                height={900}
                className="mx-auto max-h-[85vh] w-auto rounded-2xl object-contain"
              />
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {filtered[active].alt}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
