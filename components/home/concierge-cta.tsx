'use client'

import { Sparkles } from 'lucide-react'
import { LuxButton } from '@/components/ui/lux-button'

/**
 * Opens the existing global AI Concierge (components/ai-concierge.tsx) by
 * dispatching a window event it listens for. No new AI logic — just a trigger.
 */
export function ConciergeCta({
  label = 'Chat with AI Concierge',
  size = 'lg',
}: {
  label?: string
  size?: 'md' | 'lg'
}) {
  return (
    <LuxButton
      type="button"
      variant="glass"
      size={size}
      shimmer={false}
      onClick={() => window.dispatchEvent(new Event('open-concierge'))}
    >
      <Sparkles className="size-4" />
      {label}
    </LuxButton>
  )
}
