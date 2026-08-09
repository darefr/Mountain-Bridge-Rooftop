'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Faq = { q: string; a: string }

export function FaqAccordion({
  items,
  className,
}: {
  items: Faq[]
  className?: string
}) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className={cn('flex flex-col', className)}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className="border-b border-border/60">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-pretty font-serif text-lg text-foreground sm:text-xl">
                {item.q}
              </span>
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border border-border/70 text-primary transition-all duration-300',
                  isOpen && 'rotate-45 border-primary/60 bg-primary/10',
                )}
              >
                <Plus className="size-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-pretty leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
