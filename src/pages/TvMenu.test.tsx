import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
  { id: '2', name: 'Old Brew', description: '', price: 2, category: 'Coffee', available: false, sortOrder: 1 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))

import TvMenu from './TvMenu'

describe('TvMenu', () => {
  it('shows available items and hides unavailable ones', () => {
    render(<TvMenu />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('$4.50')).toBeInTheDocument()
    expect(screen.queryByText('Old Brew')).not.toBeInTheDocument()
  })
})
