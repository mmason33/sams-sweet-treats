import { useCallback, useEffect, useState } from 'react'

// Vendor-prefixed variants for older WebKit (Samsung Tizen TV browser, Safari).
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  msFullscreenElement?: Element | null
  msExitFullscreen?: () => Promise<void> | void
}
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

function fullscreenElement(): Element | null {
  const d = document as FsDocument
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? d.msFullscreenElement ?? null
}

/**
 * Cross-browser fullscreen toggle. `supported` is false where the API is
 * absent (e.g. jsdom, some TV browsers) so callers can hide the control.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const el = document.documentElement as FsElement
    setSupported(
      typeof el.requestFullscreen === 'function' ||
        typeof el.webkitRequestFullscreen === 'function' ||
        typeof el.msRequestFullscreen === 'function',
    )

    const onChange = () => setIsFullscreen(fullscreenElement() != null)
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    onChange()
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const enter = useCallback(async () => {
    const el = document.documentElement as FsElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else if (el.msRequestFullscreen) await el.msRequestFullscreen()
    } catch {
      /* user gesture required or unsupported — ignore */
    }
  }, [])

  const exit = useCallback(async () => {
    const d = document as FsDocument
    try {
      if (d.exitFullscreen) await d.exitFullscreen()
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen()
      else if (d.msExitFullscreen) await d.msExitFullscreen()
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => {
    if (fullscreenElement()) exit()
    else enter()
  }, [enter, exit])

  return { isFullscreen, supported, toggle }
}
