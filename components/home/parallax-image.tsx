'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/**
 * Large feature image with a subtle scroll-linked parallax drift.
 * Content is always visible; motion is skipped entirely for reduced-motion
 * users. The image is slightly oversized so the drift never reveals an edge.
 */
export function ParallaxImage({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  className,
}: {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={reduce ? undefined : { y }}
        className="absolute inset-0 -top-[8%] h-[116%]"
      >
        <Image
          src={src || '/placeholder.svg'}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </motion.div>
    </div>
  )
}
