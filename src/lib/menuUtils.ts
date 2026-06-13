import type { MenuItem } from './menuTypes'

export interface MenuGroup {
  category: string
  items: MenuItem[]
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
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
