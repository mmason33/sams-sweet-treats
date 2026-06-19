import { useEffect, useState } from 'react'
import { subscribeCategoryOrder } from '../lib/config'
import { CATEGORY_ORDER } from '../lib/menuUtils'

export function useCategoryOrder(): { categoryOrder: string[]; loading: boolean } {
  const [order, setOrder] = useState<string[] | null>(null)

  useEffect(() => subscribeCategoryOrder(setOrder), [])

  return {
    categoryOrder: order && order.length ? order : CATEGORY_ORDER,
    loading: order === null,
  }
}
