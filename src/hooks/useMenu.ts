import { useEffect, useState } from 'react'
import { subscribeMenu } from '../lib/menu'
import type { MenuItem } from '../lib/menuTypes'

export function useMenu(): { items: MenuItem[]; loading: boolean } {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeMenu((next) => {
      setItems(next)
      setLoading(false)
    })
    return unsub
  }, [])

  return { items, loading }
}
