import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const unsubscribe = vi.fn()
let capturedCb: ((items: MenuItem[]) => void) | null = null

vi.mock('../lib/menu', () => ({
  subscribeMenu: (cb: (items: MenuItem[]) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useMenu } from './useMenu'

describe('useMenu', () => {
  beforeEach(() => {
    capturedCb = null
    unsubscribe.mockClear()
  })

  it('starts loading then exposes items from the subscription', async () => {
    const { result } = renderHook(() => useMenu())
    expect(result.current.loading).toBe(true)

    const items: MenuItem[] = [
      { id: '1', name: 'Latte', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 0 },
    ]
    act(() => capturedCb!(items))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual(items)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useMenu())
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
