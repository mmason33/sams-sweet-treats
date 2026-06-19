import type { MenuItem } from './menuTypes'

export interface MenuGroup {
  category: string
  items: MenuItem[]
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/** Return a new array with the item at `from` moved to index `to`. Pure. */
export function reorderArray<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function sortItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

export function availableItems(items: MenuItem[]): MenuItem[] {
  return items.filter((i) => i.available)
}

export function groupByCategory(items: MenuItem[]): MenuGroup[] {
  const order: string[] = []
  const map = new Map<string, MenuItem[]>()
  for (const i of items) {
    if (!map.has(i.category)) {
      map.set(i.category, [])
      order.push(i.category)
    }
    map.get(i.category)!.push(i)
  }
  return order.map((category) => ({
    category,
    items: sortItems(map.get(category)!),
  }))
}

// Canonical display order for menu categories (drinks first, then food).
// Mirrors scripts/import-toast.ts. Unknown categories sort to the end.
export const CATEGORY_ORDER = [
  'Hot Coffee', 'Iced Coffee', 'Specialty', 'Matcha', 'Blended & Frappes',
  'Smoothies', 'Hot Chocolate', 'Energy', 'Tea & Lemonade', 'Refreshers', 'Dirty Soda',
  'Pastries', 'Muffins & Scones', 'Cookies & Bars', 'Cakes & Sweets', 'Breakfast',
]

export function orderGroups(
  groups: MenuGroup[],
  categoryOrder: string[] = CATEGORY_ORDER,
): MenuGroup[] {
  const rank = (c: string) => {
    const i = categoryOrder.indexOf(c)
    return i === -1 ? categoryOrder.length : i
  }
  return [...groups].sort(
    (a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category),
  )
}

// Pack whole categories into "boards" of at most maxItems each (a single
// category larger than the budget gets its own board). Used by the TV rotation.
export function paginateGroups(groups: MenuGroup[], maxItems: number): MenuGroup[][] {
  const pages: MenuGroup[][] = []
  let page: MenuGroup[] = []
  let count = 0
  for (const g of groups) {
    if (count > 0 && count + g.items.length > maxItems) {
      pages.push(page)
      page = []
      count = 0
    }
    page.push(g)
    count += g.items.length
  }
  if (page.length) pages.push(page)
  return pages
}
