export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  sortOrder: number
}

// Item shape when creating/updating (no id; id comes from Firestore)
export type NewMenuItem = Omit<MenuItem, 'id'>
