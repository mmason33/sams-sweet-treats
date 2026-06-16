import { useEffect, useRef } from 'react'

type WakeLockSentinel = {
  released: boolean
  release: () => Promise<void>
}
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
}

/**
 * Keeps the screen awake while `active` (Screen Wake Lock API). The browser
 * auto-releases the lock when the page is hidden, so it is re-acquired whenever
 * the page becomes visible again. No-op where the API is unavailable (e.g.
 * Samsung TV browser, jsdom).
 */
export function useWakeLock(active = true): void {
  const sentinel = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    const nav = navigator as WakeLockNavigator
    if (!nav.wakeLock) return

    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const lock = await nav.wakeLock!.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        sentinel.current = lock
      } catch {
        /* rejected (e.g. not visible / low battery) — ignore */
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }

    request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel.current?.release().catch(() => {})
      sentinel.current = null
    }
  }, [active])
}
