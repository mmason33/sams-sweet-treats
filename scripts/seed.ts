import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { auth, db } from '../src/lib/firebase'
import type { NewMenuItem } from '../src/lib/menuTypes'

const seed: NewMenuItem[] = [
  // Coffee (hot)
  { name: 'Drip Coffee', description: 'House blend, fresh brewed', price: 3, category: 'Coffee', available: true, sortOrder: 0 },
  { name: 'Americano', description: 'Espresso + hot water', price: 3.5, category: 'Coffee', available: true, sortOrder: 1 },
  { name: 'Latte', description: 'Espresso + steamed milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 2 },
  { name: 'Cappuccino', description: 'Espresso + foam', price: 4.5, category: 'Coffee', available: true, sortOrder: 3 },
  { name: 'Mocha', description: 'Chocolate + espresso + steamed milk', price: 5, category: 'Coffee', available: true, sortOrder: 4 },
  { name: 'Chai Latte', description: 'Spiced black tea + steamed milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 5 },
  { name: 'Hot Chocolate', description: 'Rich cocoa + whipped cream', price: 3.5, category: 'Coffee', available: true, sortOrder: 6 },

  // Cold Drinks
  { name: 'Cold Brew', description: 'Smooth, slow-steeped', price: 4.5, category: 'Cold Drinks', available: true, sortOrder: 0 },
  { name: 'Iced Latte', description: 'Espresso + cold milk over ice', price: 4.75, category: 'Cold Drinks', available: true, sortOrder: 1 },
  { name: 'Iced Americano', description: 'Espresso + cold water over ice', price: 3.75, category: 'Cold Drinks', available: true, sortOrder: 2 },

  // Treats
  { name: 'Cinnamon Roll', description: 'Warm, gooey, fresh-baked', price: 5, category: 'Treats', available: true, sortOrder: 0 },
  { name: 'Blueberry Muffin', description: 'Bursting with blueberries', price: 3.5, category: 'Treats', available: true, sortOrder: 1 },
  { name: 'Scone', description: 'Buttery, baked daily', price: 3.5, category: 'Treats', available: true, sortOrder: 2 },
  { name: 'Chocolate Chip Cookie', description: 'Soft-baked classic', price: 3, category: 'Treats', available: true, sortOrder: 3 },
  { name: 'Brownie', description: 'Fudgy chocolate brownie', price: 3.5, category: 'Treats', available: true, sortOrder: 4 },
  { name: 'Croissant', description: 'Flaky, golden, all-butter', price: 4, category: 'Treats', available: true, sortOrder: 5 },
  { name: 'Banana Bread', description: 'Moist, house-made slice', price: 3.5, category: 'Treats', available: true, sortOrder: 6 },
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
