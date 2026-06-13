import { describe, it, expect } from 'vitest'
import type { MenuItem } from './menuTypes'
import { formatPrice, sortItems, groupByCategory, availableItems } from './menuUtils'

const item = (over: Partial<MenuItem>): MenuItem => ({
  id: 'x',
  name: 'Item',
  description: '',
  price: 1,
  category: 'Treats',
  available: true,
  sortOrder: 0,
  ...over,
})

describe('formatPrice', () => {
  it('formats whole dollars with cents', () => {
    expect(formatPrice(4)).toBe('$4.00')
  })
  it('formats fractional dollars', () => {
    expect(formatPrice(4.5)).toBe('$4.50')
  })
})

describe('sortItems', () => {
  it('sorts by sortOrder then name', () => {
    const a = item({ id: 'a', name: 'Zed', sortOrder: 1 })
    const b = item({ id: 'b', name: 'Abe', sortOrder: 2 })
    const c = item({ id: 'c', name: 'Mid', sortOrder: 1 })
    const sorted = sortItems([b, a, c]).map((i) => i.id)
    // sortOrder 1 group ordered by name (Mid < Zed), then sortOrder 2
    expect(sorted).toEqual(['c', 'a', 'b'])
  })
})

describe('availableItems', () => {
  it('keeps only available items', () => {
    const a = item({ id: 'a', available: true })
    const b = item({ id: 'b', available: false })
    expect(availableItems([a, b]).map((i) => i.id)).toEqual(['a'])
  })
})

describe('groupByCategory', () => {
  it('groups items by category in first-seen order, sorted within group', () => {
    const coffee1 = item({ id: 'c1', category: 'Coffee', sortOrder: 2 })
    const treat1 = item({ id: 't1', category: 'Treats', sortOrder: 1 })
    const coffee2 = item({ id: 'c2', category: 'Coffee', sortOrder: 1 })
    const groups = groupByCategory([coffee1, treat1, coffee2])
    expect(groups.map((g) => g.category)).toEqual(['Coffee', 'Treats'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['c2', 'c1'])
  })
})
