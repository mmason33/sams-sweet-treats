import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from './useFullscreen'
import { useWakeLock } from './useWakeLock'
import { useIdleCursor } from './useIdleCursor'

describe('useFullscreen', () => {
  afterEach(() => {
    delete (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen
    delete (document as { exitFullscreen?: unknown }).exitFullscreen
    delete (document as { fullscreenElement?: unknown }).fullscreenElement
  })

  it('reports unsupported when the API is absent', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.supported).toBe(false)
  })

  it('enters fullscreen, then exits when already fullscreen', async () => {
    const request = vi.fn().mockResolvedValue(undefined)
    const exit = vi.fn().mockResolvedValue(undefined)
    document.documentElement.requestFullscreen = request
    ;(document as { exitFullscreen?: () => Promise<void> }).exitFullscreen = exit
    let fsEl: Element | null = null
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fsEl })

    const { result } = renderHook(() => useFullscreen())
    expect(result.current.supported).toBe(true)

    await act(async () => {
      result.current.toggle()
    })
    expect(request).toHaveBeenCalledTimes(1)
    expect(exit).not.toHaveBeenCalled()

    fsEl = document.documentElement // now "in" fullscreen
    await act(async () => {
      result.current.toggle()
    })
    expect(exit).toHaveBeenCalledTimes(1)
  })
})

describe('useWakeLock', () => {
  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock
  })

  it('acquires a screen lock and releases it on unmount', async () => {
    const release = vi.fn().mockResolvedValue(undefined)
    const request = vi.fn().mockResolvedValue({ released: false, release })
    ;(navigator as { wakeLock?: unknown }).wakeLock = { request }

    const { unmount } = renderHook(() => useWakeLock(true))
    await act(async () => {})
    expect(request).toHaveBeenCalledWith('screen')

    unmount()
    await act(async () => {})
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('does nothing when inactive', async () => {
    const request = vi.fn()
    ;(navigator as { wakeLock?: unknown }).wakeLock = { request }
    renderHook(() => useWakeLock(false))
    await act(async () => {})
    expect(request).not.toHaveBeenCalled()
  })
})

describe('useIdleCursor', () => {
  afterEach(() => vi.useRealTimers())

  it('becomes idle after the delay and resets on activity', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useIdleCursor(1000))
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('mousemove'))
    })
    expect(result.current).toBe(false)
  })
})
