import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { User } from 'firebase/auth'

let capturedCb: ((u: User | null) => void) | null = null
const unsubscribe = vi.fn()
vi.mock('../lib/auth', () => ({
  subscribeAuth: (cb: (u: User | null) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('starts loading, then reports the signed-in user', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)

    act(() => capturedCb!({ uid: 'u1' } as User))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.uid).toBe('u1')
  })

  it('reports null when signed out', async () => {
    const { result } = renderHook(() => useAuth())
    act(() => capturedCb!(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })
})
