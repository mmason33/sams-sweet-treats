import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MenuList from './MenuList'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: 'Espresso + milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 1 },
  { id: '2', name: 'Drip', description: '', price: 3, category: 'Coffee', available: false, sortOrder: 0 },
  { id: '3', name: 'Cinnamon Roll', description: '', price: 5, category: 'Treats', available: true, sortOrder: 0 },
]

describe('MenuList', () => {
  it('renders available items grouped by category and hides unavailable', () => {
    render(<MenuList items={items} />)
    expect(screen.getByRole('heading', { name: 'Coffee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Treats' })).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Cinnamon Roll')).toBeInTheDocument()
    // unavailable "Drip" is hidden
    expect(screen.queryByText('Drip')).not.toBeInTheDocument()
  })

  it('shows an empty message when nothing is available', () => {
    render(<MenuList items={[]} />)
    expect(screen.getByText(/menu coming soon/i)).toBeInTheDocument()
  })
})
