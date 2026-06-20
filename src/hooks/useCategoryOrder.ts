import { useEffect, useState } from 'react'
import { subscribeCategoryOrder } from '../lib/config'
import { CATEGORY_ORDER } from '../lib/menuUtils'

export function useCategoryOrder(): {
  categoryOrder: string[]
  savedCategories: string[]
  loading: boolean
} {
  const [order, setOrder] = useState<string[] | null>(null)

  useEffect(() => subscribeCategoryOrder(setOrder), [])

  return {
    // Fallback-applied order for the public menu (drinks-first canonical default).
    categoryOrder: order && order.length ? order : CATEGORY_ORDER,
    // Raw saved list ([] when unset) — the admin's source of truth for which
    // categories exist, including empty ones.
    savedCategories: order ?? [],
    loading: order === null,
  }
}
