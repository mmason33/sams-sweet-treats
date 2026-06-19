import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MenuItem, NewMenuItem } from './menuTypes'

const COLLECTION = 'menuItems'

/** Subscribe to all menu items in real time. Returns an unsubscribe fn. */
export function subscribeMenu(onChange: (items: MenuItem[]) => void): () => void {
  const q = query(collection(db, COLLECTION))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as NewMenuItem) }) as MenuItem,
    )
    onChange(items)
  })
}

export async function addMenuItem(item: NewMenuItem): Promise<void> {
  // Firestore rejects `undefined`; drop an unset large price rather than store it.
  const data: Record<string, unknown> = { ...item }
  if (data.largePrice == null) delete data.largePrice
  await addDoc(collection(db, COLLECTION), data)
}

export async function updateMenuItem(
  id: string,
  patch: Partial<NewMenuItem>,
): Promise<void> {
  const data: Record<string, unknown> = { ...patch }
  // A cleared large price (key present but unset) becomes a field delete.
  if ('largePrice' in patch && data.largePrice == null) {
    data.largePrice = deleteField()
  }
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

/** Persist a new within-category order by writing each item's index as sortOrder. */
export async function reorderItems(orderedItems: MenuItem[]): Promise<void> {
  const batch = writeBatch(db)
  orderedItems.forEach((item, index) => {
    batch.update(doc(db, COLLECTION, item.id), { sortOrder: index })
  })
  await batch.commit()
}

/** Reassign every given item to a new category name in one batch (rename). */
export async function renameCategoryItems(
  items: MenuItem[],
  newCategory: string,
): Promise<void> {
  const batch = writeBatch(db)
  items.forEach((item) => {
    batch.update(doc(db, COLLECTION, item.id), { category: newCategory })
  })
  await batch.commit()
}
