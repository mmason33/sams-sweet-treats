import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))

import Home from './Home'

describe('Home', () => {
  it('renders the business name and the live menu', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sam's sweet/i)
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('renders an order-ahead link to Toast', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /order ahead/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('toast'))
  })
})
