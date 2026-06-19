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
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: ['Coffee', 'Treats'], loading: false }),
}))

const addMenuItem = vi.fn().mockResolvedValue(undefined)
const updateMenuItem = vi.fn().mockResolvedValue(undefined)
const deleteMenuItem = vi.fn().mockResolvedValue(undefined)
const reorderItems = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/menu', () => ({
  addMenuItem: (...a: unknown[]) => addMenuItem(...a),
  updateMenuItem: (...a: unknown[]) => updateMenuItem(...a),
  deleteMenuItem: (...a: unknown[]) => deleteMenuItem(...a),
  reorderItems: (...a: unknown[]) => reorderItems(...a),
}))

const saveCategoryOrder = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/config', () => ({
  saveCategoryOrder: (...a: unknown[]) => saveCategoryOrder(...a),
}))

import Admin from './Admin'

function rowFor(name: string) {
  return screen.getByText(name).closest('li') as HTMLElement
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists all items including hidden ones, grouped by category', () => {
    render(<Admin />)
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Treats')).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('adds a new item, appending sortOrder to the end of its category', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/name/i), 'Mocha')
    await user.type(within(dialog).getByLabelText(/category/i), 'Coffee')
    await user.type(within(dialog).getByLabelText(/price/i), '5')
    await user.click(within(dialog).getByRole('button', { name: /add item/i }))
    // Coffee already has sortOrder 0 and 1, so the new item appends at 2.
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mocha', category: 'Coffee', price: 5, available: true, sortOrder: 2 }),
    )
  })

  it('does not show a sort order field in the modal', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByLabelText(/sort order/i)).not.toBeInTheDocument()
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
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
    expect(deleteMenuItem).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('3')
  })

  it('search is find-only: filters items and disables drag handles', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'brown')
    expect(screen.getByText('Brownie')).toBeInTheDocument()
    expect(screen.queryByText('Latte')).not.toBeInTheDocument()
    // No drag handles while filtering.
    expect(screen.queryByLabelText(/reorder/i)).not.toBeInTheDocument()
  })

  it('row actions still work in search mode', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    // Filter to Brownie (which is hidden, available: false)
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'brown')
    // Toggle Show button
    const brownieRow = rowFor('Brownie')
    await user.click(within(brownieRow).getByRole('button', { name: /show/i }))
    expect(updateMenuItem).toHaveBeenCalledWith('3', { available: true })
    vi.clearAllMocks()
    // Click Delete button
    await user.click(within(brownieRow).getByRole('button', { name: /delete/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
    expect(deleteMenuItem).not.toHaveBeenCalled()
    // Confirm delete
    await user.click(within(dialog).getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('3')
  })
})
