'use client'

import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

// Accessible 6-digit one-time-code input. Emits the joined string via onChange
// and calls onComplete when all digits are filled.
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  autoFocus = true,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  invalid?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setDigit(index: number, digit: string) {
    const next = digits.slice()
    next[index] = digit
    const joined = next.join('').slice(0, length)
    onChange(joined)
    if (joined.length === length && !joined.includes('') && onComplete) onComplete(joined)
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) {
      setDigit(index, '')
      return
    }
    setDigit(index, digit)
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    refs.current[focusIndex]?.focus()
    if (pasted.length === length && onComplete) onComplete(pasted)
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'h-14 w-11 rounded-xl border bg-background/40 text-center font-mono text-2xl text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 sm:w-12',
            invalid ? 'border-destructive/60' : 'border-border/70',
            disabled && 'opacity-50',
          )}
        />
      ))}
    </div>
  )
}
