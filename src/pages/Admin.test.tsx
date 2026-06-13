import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MenuItem } from '../lib/menuTypes'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}))

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({ useMenu: () => ({ items, loading: false }) }))

const addMenuItem = vi.fn().mockResolvedValue(undefined)
const updateMenuItem = vi.fn().mockResolvedValue(undefined)
const deleteMenuItem = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/menu', () => ({
  addMenuItem: (...a: unknown[]) => addMenuItem(...a),
  updateMenuItem: (...a: unknown[]) => updateMenuItem(...a),
  deleteMenuItem: (...a: unknown[]) => deleteMenuItem(...a),
}))

import Admin from './Admin'

describe('Admin', () => {
  it('lists existing items including their availability', () => {
    render(<Admin />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('adds a new item from the form', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.type(screen.getByLabelText(/name/i), 'Mocha')
    await user.type(screen.getByLabelText(/category/i), 'Coffee')
    await user.type(screen.getByLabelText(/price/i), '5')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mocha', category: 'Coffee', price: 5, available: true }),
    )
  })

  it('toggles availability of an existing item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /hide/i }))
    expect(updateMenuItem).toHaveBeenCalledWith('1', { available: false })
  })

  it('deletes an item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('1')
  })
})
