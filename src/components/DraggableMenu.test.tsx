import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DraggableMenu from './DraggableMenu'
import type { MenuItem } from '../lib/menuTypes'
import type { MenuGroup } from '../lib/menuUtils'

const latte: MenuItem = { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 }
const americano: MenuItem = { id: '2', name: 'Americano', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 1 }
const brownie: MenuItem = { id: '3', name: 'Brownie', description: '', price: 3.95, category: 'Treats', available: false, sortOrder: 0 }

const groups: MenuGroup[] = [
  { category: 'Coffee', items: [latte, americano] },
  { category: 'Treats', items: [brownie] },
]

function renderMenu(overrides: Partial<React.ComponentProps<typeof DraggableMenu>> = {}) {
  const props = {
    groups,
    onReorderCategories: vi.fn(),
    onReorderItems: vi.fn(),
    onRenameCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
    onEdit: vi.fn(),
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<DraggableMenu {...props} />)
  return props
}

describe('DraggableMenu', () => {
  it('renders categories and their items', () => {
    renderMenu()
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Treats')).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Americano')).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('exposes drag handles for categories and items', () => {
    renderMenu()
    expect(screen.getByLabelText(/reorder coffee category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reorder latte/i)).toBeInTheDocument()
  })

  it('collapses and expands a category independently', async () => {
    const user = userEvent.setup()
    renderMenu()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /collapse coffee/i }))
    expect(screen.queryByText('Latte')).not.toBeInTheDocument()
    expect(screen.queryByText('Americano')).not.toBeInTheDocument()
    // Other categories stay open.
    expect(screen.getByText('Brownie')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /expand coffee/i }))
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('fires category rename and only shows delete for empty categories', async () => {
    const user = userEvent.setup()
    const props = renderMenu({
      groups: [
        { category: 'Coffee', items: [latte] },
        { category: 'Empty', items: [] },
      ],
    })
    const coffeeHeader = screen.getByText('Coffee').closest('div') as HTMLElement
    await user.click(within(coffeeHeader).getByRole('button', { name: /rename/i }))
    expect(props.onRenameCategory).toHaveBeenCalledWith('Coffee')
    // Non-empty category has no delete; empty one does.
    expect(within(coffeeHeader).queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
    const emptyHeader = screen.getByText('Empty').closest('div') as HTMLElement
    await user.click(within(emptyHeader).getByRole('button', { name: /delete/i }))
    expect(props.onDeleteCategory).toHaveBeenCalledWith('Empty')
  })

  it('fires row callbacks', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    const row = screen.getByText('Latte').closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /edit/i }))
    expect(props.onEdit).toHaveBeenCalledWith(latte)
    await user.click(within(row).getByRole('button', { name: /hide/i }))
    expect(props.onToggle).toHaveBeenCalledWith(latte)
    await user.click(within(row).getByRole('button', { name: /delete/i }))
    expect(props.onDelete).toHaveBeenCalledWith(latte)
  })
})
