import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

/** Subscribe to the saved category display order. Empty array when unset. */
export function subscribeCategoryOrder(onChange: (order: string[]) => void): () => void {
  return onSnapshot(doc(db, 'config', 'menu'), (snap) => {
    const data = snap.data() as { categoryOrder?: string[] } | undefined
    onChange(data?.categoryOrder ?? [])
  })
}

/** Persist the category display order. */
export async function saveCategoryOrder(order: string[]): Promise<void> {
  await setDoc(doc(db, 'config', 'menu'), { categoryOrder: order }, { merge: true })
}
