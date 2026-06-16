import { useEffect, useState } from 'react'

/**
 * Returns true once the pointer has been idle for `delayMs`, so a kiosk view
 * can hide the cursor. Any pointer/key activity reveals it again.
 */
export function useIdleCursor(delayMs = 4000): boolean {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reset = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), delayMs)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [delayMs])

  return idle
}
