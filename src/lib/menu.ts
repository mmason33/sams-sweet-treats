import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
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
  await addDoc(collection(db, COLLECTION), item)
}

export async function updateMenuItem(
  id: string,
  patch: Partial<NewMenuItem>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), patch)
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
