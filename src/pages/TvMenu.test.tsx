import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
  { id: '2', name: 'Old Brew', description: '', price: 2, category: 'Coffee', available: false, sortOrder: 1 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: [], loading: false }),
}))

import TvMenu from './TvMenu'

describe('TvMenu', () => {
  afterEach(() => {
    delete (document.documentElement as { requestFullscreen?: unknown }).requestFullscreen
  })

  it('shows available items and hides unavailable ones', () => {
    render(<TvMenu />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('$4.50')).toBeInTheDocument()
    expect(screen.queryByText('Old Brew')).not.toBeInTheDocument()
  })

  it('hides the fullscreen toggle where the API is unsupported', () => {
    render(<TvMenu />)
    expect(screen.queryByRole('button', { name: /fullscreen/i })).not.toBeInTheDocument()
  })

  it('shows a fullscreen toggle when the browser supports it', () => {
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    render(<TvMenu />)
    expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument()
  })
})
