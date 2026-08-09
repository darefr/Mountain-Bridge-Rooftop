'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { UploadCloud, X, ImageIcon, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_INPUT_BYTES = 12 * 1024 * 1024 // 12MB raw upload cap
const MAX_DIMENSION = 1600 // longest edge after resize
const OUTPUT_QUALITY = 0.82

/**
 * Client-side image picker with drag & drop, preview, validation and
 * automatic resize/compression to a data URL. Data URLs are stored directly
 * in the content store — consistent with how the app already persists images
 * (e.g. user avatars) and works on read-only serverless filesystems.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  className,
  aspect = 'video',
}: {
  value?: string
  onChange: (dataUrl: string) => void
  label?: string
  className?: string
  aspect?: 'video' | 'square'
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const process = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.')
        return
      }
      if (file.size > MAX_INPUT_BYTES) {
        setError('Image is too large (max 12MB).')
        return
      }
      setBusy(true)
      try {
        const dataUrl = await resizeImage(file)
        onChange(dataUrl)
      } catch {
        setError('Could not process that image.')
      } finally {
        setBusy(false)
      }
    },
    [onChange],
  )

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) process(f)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-border/60">
          <div className={cn('relative w-full bg-muted', aspect === 'square' ? 'aspect-square' : 'aspect-video')}>
            {/* Using a plain img keeps data URLs simple and avoids the optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value || '/placeholder.svg'} alt="Preview" className="h-full w-full object-cover" />
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="grid size-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
              title="Replace image"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="grid size-8 place-items-center rounded-full bg-destructive/90 text-white backdrop-blur transition-colors hover:bg-destructive"
              title="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) process(f)
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/70 bg-background/40 px-4 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5',
            aspect === 'square' ? 'aspect-square' : 'min-h-[9rem]',
            dragOver && 'border-primary bg-primary/10',
          )}
        >
          {busy ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : (
            <>
              <span className="grid size-11 place-items-center rounded-full bg-primary/12 text-primary">
                {dragOver ? <ImageIcon className="size-5" /> : <UploadCloud className="size-5" />}
              </span>
              <span className="text-sm font-medium text-foreground">Drop image or tap to upload</span>
              <span className="text-xs text-muted-foreground">JPG, PNG or WebP · auto-optimised · max 12MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// Resize on a canvas and export a compressed data URL.
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no ctx'))
        ctx.drawImage(img, 0, 0, width, height)
        const hasAlpha = file.type === 'image/png'
        const out = canvas.toDataURL(hasAlpha ? 'image/webp' : 'image/jpeg', OUTPUT_QUALITY)
        resolve(out)
      }
      img.onerror = () => reject(new Error('bad image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('read error'))
    reader.readAsDataURL(file)
  })
}
