import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuList from './MenuList'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: 'Espresso + milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 1 },
  { id: '2', name: 'Drip', description: '', price: 3, category: 'Coffee', available: false, sortOrder: 0 },
  { id: '3', name: 'Cinnamon Roll', description: '', price: 5, category: 'Treats', available: true, sortOrder: 0 },
]

describe('MenuList', () => {
  it('opens on the first category and hides unavailable items', () => {
    render(<MenuList items={items} />)
    // Filter pills for All + each category
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coffee' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Treats' })).toBeInTheDocument()
    // Default shows the first category only
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.queryByText('Drip')).not.toBeInTheDocument()
    expect(screen.queryByText('Cinnamon Roll')).not.toBeInTheDocument()
  })

  it('filters to a category when its pill is tapped', async () => {
    const user = userEvent.setup()
    render(<MenuList items={items} />)
    await user.click(screen.getByRole('button', { name: 'Treats' }))
    expect(screen.getByText('Cinnamon Roll')).toBeInTheDocument()
    expect(screen.queryByText('Latte')).not.toBeInTheDocument()
  })

  it('shows every category when All is tapped', async () => {
    const user = userEvent.setup()
    render(<MenuList items={items} />)
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Cinnamon Roll')).toBeInTheDocument()
  })

  it('shows an empty message when nothing is available', () => {
    render(<MenuList items={[]} />)
    expect(screen.getByText(/menu coming soon/i)).toBeInTheDocument()
  })
})
