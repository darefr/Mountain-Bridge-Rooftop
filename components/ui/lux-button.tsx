import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

const luxButton = cva(
  'group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full font-medium tracking-wide whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform',
  {
    variants: {
      variant: {
        luxury:
          'bg-gradient-to-b from-[oklch(0.86_0.11_86)] to-[oklch(0.74_0.1_78)] text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.8_0.1_82_/_45%)] hover:shadow-[0_16px_40px_-12px_oklch(0.8_0.1_82_/_60%)] hover:-translate-y-0.5',
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/20',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/85 hover:-translate-y-0.5',
        glass:
          'glass text-foreground hover:border-primary/40 hover:-translate-y-0.5',
        outline:
          'border border-border/80 bg-transparent text-foreground hover:border-primary/60 hover:bg-primary/5',
        ghost: 'text-foreground/80 hover:text-foreground hover:bg-foreground/5',
        danger:
          'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30',
        success:
          'bg-success/15 text-success hover:bg-success/25 border border-success/30',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-sm sm:text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'luxury', size: 'md' },
  },
)

type BaseProps = VariantProps<typeof luxButton> & {
  className?: string
  shimmer?: boolean
}

export function LuxButton({
  className,
  variant,
  size,
  shimmer = true,
  children,
  ...props
}: BaseProps & ComponentProps<'button'>) {
  return (
    <button
      className={cn(luxButton({ variant, size }), shimmer && 'shine', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function LuxLink({
  className,
  variant,
  size,
  shimmer = true,
  children,
  href,
  ...props
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(luxButton({ variant, size }), shimmer && 'shine', className)}
      {...props}
    >
      {children}
    </Link>
  )
}

export { luxButton }
