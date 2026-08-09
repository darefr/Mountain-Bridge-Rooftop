'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { site } from '@/lib/site'

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-center gap-3">
      <a
        href={site.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="glass-strong grid size-12 place-items-center rounded-full text-success shadow-lg transition-transform hover:-translate-y-0.5 hover:text-success"
      >
        <MessageCircle className="size-5" />
        <span className="sr-only">WhatsApp</span>
      </a>

      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() =>
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            aria-label="Back to top"
            className="glass grid size-11 place-items-center rounded-full text-foreground/80 transition-colors hover:text-primary"
          >
            <ArrowUp className="size-4.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
