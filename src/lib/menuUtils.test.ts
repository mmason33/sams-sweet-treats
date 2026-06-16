import { describe, it, expect } from 'vitest'
import type { MenuItem } from './menuTypes'
import {
  formatPrice,
  sortItems,
  groupByCategory,
  availableItems,
  orderGroups,
  paginateGroups,
} from './menuUtils'

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

describe('orderGroups', () => {
  it('orders known categories by canonical order, unknown ones last (alphabetical)', () => {
    const g = (category: string) => ({ category, items: [] })
    const ordered = orderGroups([g('Pastries'), g('Zebra'), g('Hot Coffee'), g('Apple')])
    expect(ordered.map((x) => x.category)).toEqual(['Hot Coffee', 'Pastries', 'Apple', 'Zebra'])
  })
})

describe('paginateGroups', () => {
  it('packs whole categories into boards within the item budget', () => {
    const mk = (category: string, n: number) => ({
      category,
      items: Array.from({ length: n }, (_, i) => item({ id: `${category}${i}`, category })),
    })
    const pages = paginateGroups([mk('A', 4), mk('B', 4), mk('C', 3)], 7)
    // A+B = 8 > 7, so B starts a new board; C fits with B (4+3=7).
    expect(pages.map((p) => p.map((g) => g.category))).toEqual([['A'], ['B', 'C']])
  })

  it('gives an oversized category its own board', () => {
    const big = { category: 'Big', items: Array.from({ length: 20 }, (_, i) => item({ id: `b${i}` })) }
    const pages = paginateGroups([big], 7)
    expect(pages).toHaveLength(1)
    expect(pages[0][0].items).toHaveLength(20)
  })
})
