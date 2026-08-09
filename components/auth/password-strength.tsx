'use client'

import { Check, X } from 'lucide-react'
import { passwordChecks, passwordScore } from '@/lib/auth/password'
import { cn } from '@/lib/utils'

const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const barColors = [
  'bg-destructive',
  'bg-destructive',
  'bg-primary/60',
  'bg-primary',
  'bg-success',
]

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = passwordScore(password)
  const checks = passwordChecks(password)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < score ? barColors[score] : 'bg-border/60',
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{labels[score]}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              'flex items-center gap-1.5 text-[0.7rem]',
              c.met ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {c.met ? <Check className="size-3" /> : <X className="size-3 opacity-60" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
