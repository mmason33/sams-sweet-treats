import type { MenuItem } from './menuTypes'

export interface MenuGroup {
  category: string
  items: MenuItem[]
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/** Price line for an item: "Reg $X · Lg $Y" when a large price is set, else "$X". */
export function formatItemPrice(item: { price: number; largePrice?: number }): string {
  return item.largePrice != null
    ? `Reg ${formatPrice(item.price)} · Lg ${formatPrice(item.largePrice)}`
    : formatPrice(item.price)
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

/**
 * Build the admin's category sections from the saved category list. Includes
 * empty categories (saved but with no items yet); item categories missing from
 * the saved list are appended. With no saved categories, falls back to the
 * canonical order over just the categories that have items.
 */
export function buildCategoryGroups(items: MenuItem[], savedCategories: string[]): MenuGroup[] {
  const withItems = groupByCategory(items)
  if (savedCategories.length === 0) {
    return orderGroups(withItems)
  }
  const map = new Map(withItems.map((g) => [g.category, g]))
  const seen = new Set<string>()
  const result: MenuGroup[] = []
  for (const category of savedCategories) {
    result.push(map.get(category) ?? { category, items: [] })
    seen.add(category)
  }
  for (const g of withItems) {
    if (!seen.has(g.category)) result.push(g)
  }
  return result
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
