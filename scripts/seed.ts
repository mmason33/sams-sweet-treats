import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { auth, db } from '../src/lib/firebase'
import type { NewMenuItem } from '../src/lib/menuTypes'

const seed: NewMenuItem[] = [
  { name: 'Drip Coffee', description: 'House blend', price: 3, category: 'Coffee', available: true, sortOrder: 0 },
  { name: 'Latte', description: 'Espresso + steamed milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 1 },
  { name: 'Mocha', description: 'Chocolate + espresso', price: 5, category: 'Coffee', available: true, sortOrder: 2 },
  { name: 'Cinnamon Roll', description: 'Warm, gooey, fresh-baked', price: 5, category: 'Treats', available: true, sortOrder: 0 },
  { name: 'Cookie', description: 'Chocolate chip', price: 3, category: 'Treats', available: true, sortOrder: 1 },
]

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars')
  }
  await signInWithEmailAndPassword(auth, email, password)

  const existing = await getDocs(collection(db, 'menuItems'))
  if (!existing.empty) {
    console.log(`menuItems already has ${existing.size} docs — skipping seed.`)
    return
  }
  for (const item of seed) {
    await addDoc(collection(db, 'menuItems'), item)
    console.log(`Added ${item.name}`)
  }
  console.log('Seed complete.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
