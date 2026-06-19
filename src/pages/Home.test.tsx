import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: [], loading: false }),
}))

import Home from './Home'

// Home renders <Nav> which uses react-router <Link>, so it needs a Router.
function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the business name and the live menu', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sam's sweet/i)
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('shows the Pine Grove location and hours', () => {
    renderHome()
    expect(screen.getAllByText(/pine grove/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5am/i).length).toBeGreaterThan(0)
  })

  it('links to Instagram and Facebook', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /instagram/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /facebook/i })).toBeInTheDocument()
  })

  it('links to the Toast online ordering page', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /order online/i })).toHaveAttribute(
      'href',
      expect.stringContaining('order.toasttab.com'),
    )
  })
})
