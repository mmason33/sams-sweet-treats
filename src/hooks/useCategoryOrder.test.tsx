import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { CATEGORY_ORDER } from '../lib/menuUtils'

const unsubscribe = vi.fn()
let capturedCb: ((order: string[]) => void) | null = null

vi.mock('../lib/config', () => ({
  subscribeCategoryOrder: (cb: (order: string[]) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useCategoryOrder } from './useCategoryOrder'

describe('useCategoryOrder', () => {
  beforeEach(() => {
    capturedCb = null
    unsubscribe.mockClear()
  })

  it('starts loading then exposes the saved order', async () => {
    const { result } = renderHook(() => useCategoryOrder())
    expect(result.current.loading).toBe(true)
    act(() => capturedCb!(['Treats', 'Coffee']))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categoryOrder).toEqual(['Treats', 'Coffee'])
  })

  it('falls back to the canonical order when none is saved', async () => {
    const { result } = renderHook(() => useCategoryOrder())
    act(() => capturedCb!([]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categoryOrder).toEqual(CATEGORY_ORDER)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useCategoryOrder())
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
