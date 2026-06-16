import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MenuItem } from '../lib/menuTypes'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}))

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
  { id: '2', name: 'Americano', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 1 },
  { id: '3', name: 'Brownie', description: '', price: 3.95, category: 'Treats', available: false, sortOrder: 0 },
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

// Find the table row containing the given item name.
function rowFor(name: string) {
  return screen.getByText(name).closest('tr') as HTMLElement
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists all items including hidden ones', () => {
    render(<Admin />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Americano')).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('adds a new item through the modal', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/name/i), 'Mocha')
    await user.type(within(dialog).getByLabelText(/category/i), 'Coffee')
    await user.type(within(dialog).getByLabelText(/price/i), '5')
    await user.click(within(dialog).getByRole('button', { name: /add item/i }))
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mocha', category: 'Coffee', price: 5, available: true }),
    )
  })

  it('toggles availability of an existing item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Latte')).getByRole('button', { name: /hide/i }))
    expect(updateMenuItem).toHaveBeenCalledWith('1', { available: false })
  })

  it('edits an existing item through the modal', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Latte')).getByRole('button', { name: /edit/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue('Latte')
    const price = within(dialog).getByLabelText(/price/i)
    await user.clear(price)
    await user.type(price, '6')
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))
    expect(updateMenuItem).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Latte', category: 'Coffee', price: 6 }),
    )
    expect(addMenuItem).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Brownie')).getByRole('button', { name: /delete/i }))
    // Confirm modal appears; nothing deleted yet.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
    expect(deleteMenuItem).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('3')
  })

  it('filters the table with the search box', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'brown')
    expect(screen.getByText('Brownie')).toBeInTheDocument()
    expect(screen.queryByText('Latte')).not.toBeInTheDocument()
  })

  it('sorts by name when the Name header is clicked', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /name/i }))
    const names = screen
      .getAllByRole('row')
      .slice(1) // skip header row
      .map((r) => r.querySelector('td')?.textContent)
    expect(names).toEqual(['Americano', 'Brownie', 'Latte'])
  })
})
