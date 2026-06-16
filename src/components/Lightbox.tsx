import { useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons'

interface LightboxProps {
  /** Photo filenames (relative to BASE_URL images/). */
  photos: string[]
  /** Index of the photo to show, or null when the lightbox is closed. */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

// Full-screen image viewer with prev/next navigation. Dismissable via the close
// button, backdrop click, or Escape; arrow keys step between photos.
export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null

  const go = useCallback(
    (dir: -1 | 1) => {
      if (index === null) return
      onNavigate((index + dir + photos.length) % photos.length)
    },
    [index, photos.length, onNavigate],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, go])

  if (index === null) return null

  const src = `${import.meta.env.BASE_URL}images/${photos[index]}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-cocoa/90 backdrop-blur-sm"
    >
      {/* Backdrop click-away */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream transition hover:bg-white/20"
      >
        <XIcon className="h-6 w-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-cream transition hover:bg-white/20 sm:left-4"
          >
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-cream transition hover:bg-white/20 sm:right-4"
          >
            <ChevronRightIcon className="h-7 w-7" />
          </button>
        </>
      )}

      <img
        src={src}
        alt=""
        className="relative z-[5] max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />

      {photos.length > 1 && (
        <span className="absolute bottom-5 z-10 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-cream">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>
  )
}
