# Sam's Sweet Treats & Coffee — Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-page marketing/info site for a coffee & treat trailer business, with a public interactive menu, a landscape TV menu, and an auth-protected admin editor — all backed by Firebase Firestore and deployed to GitHub Pages.

**Architecture:** A static React SPA (Vite + TypeScript) served from GitHub Pages. Three routes via hash routing: `/` (home + interactive menu), `/tv` (large-type landscape menu for a Samsung TV), and `/admin` (Firebase email/password login → Firestore menu CRUD). Menu data lives in a single Firestore `menuItems` collection, read publicly in real time and written only by authenticated admins (enforced by security rules). Toast POS integration is explicitly out of scope (linked externally for now).

**Tech Stack:** React 18, Vite, TypeScript, react-router-dom (HashRouter), Tailwind CSS v4 (`@tailwindcss/vite`), Firebase JS SDK v10 (Auth + Firestore), Vitest + React Testing Library, GitHub Actions → GitHub Pages.

---

## File Structure

```
package.json                      # deps + scripts
vite.config.ts                    # Vite + react + tailwind + vitest config (base: './')
tsconfig.json                     # TS config (bundler mode)
tsconfig.node.json                # TS config for vite.config.ts
index.html                        # SPA entry
.gitignore                        # add node_modules, dist (keep scratch ignore)
firestore.rules                   # public read / authed write rules
scripts/seed.ts                   # one-off Firestore seeder (client SDK + admin creds)
.github/workflows/deploy.yml      # build + deploy to GitHub Pages
public/
  images/                         # logo + photos (moved from /images)
  CNAME                           # custom domain (added in deploy task; commented note)
src/
  main.tsx                        # React root + router
  App.tsx                         # <HashRouter> + <Routes>
  index.css                       # tailwind import + brand theme tokens
  test/setup.ts                   # jest-dom + global test setup
  lib/
    firebase.ts                   # init app, export auth + db (moved/expanded from root firebase.ts)
    menuTypes.ts                  # MenuItem interface + NewMenuItem
    menuUtils.ts                  # PURE helpers: formatPrice, sortItems, groupByCategory, availableItems
    menu.ts                       # Firestore CRUD: subscribeMenu, addMenuItem, updateMenuItem, deleteMenuItem
    auth.ts                       # signIn, signOutUser, subscribeAuth wrappers
  hooks/
    useMenu.ts                    # subscribe to menuItems → {items, loading}
    useAuth.ts                    # subscribe to auth state → {user, loading}
  components/
    MenuItemCard.tsx              # one menu item (public/home styling)
    MenuList.tsx                  # grouped, available-only menu for home
    ProtectedRoute.tsx           # gate that renders <Login/> when signed out
    Login.tsx                     # email/password form
  pages/
    Home.tsx                      # hero, about, photos, links, <MenuList/>
    TvMenu.tsx                    # full-screen landscape menu, realtime
    Admin.tsx                     # menu editor table + add/edit/delete/toggle
```

Each file has one responsibility. Pure logic (`menuUtils.ts`) is isolated from Firebase I/O (`menu.ts`) so it can be unit-tested without mocks. Firebase wrappers (`menu.ts`, `auth.ts`) are thin so they're easy to mock in component/hook tests.

---

## Data Model

Firestore collection `menuItems`, one document per item:

| Field         | Type      | Notes                                            |
|---------------|-----------|--------------------------------------------------|
| `name`        | string    | e.g. "Cinnamon Roll"                             |
| `description` | string    | short description                                |
| `price`       | number    | dollars, e.g. `4.5`                              |
| `category`    | string    | e.g. "Coffee", "Treats", "Specials"              |
| `available`   | boolean   | hidden from public/TV when `false`               |
| `sortOrder`   | number    | ascending sort within a category                 |

`id` is the Firestore document id (not stored in the doc body).

---

### Task 1: Project scaffold (Vite + React + TS)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sams-sweet",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "firebase": "^10.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.1.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "scripts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`** (uses `vitest/config` so the `test` field type-checks)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // relative asset paths so it works at /<repo>/ and on the custom domain
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/jpeg" href="./images/sams-logo.jpg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sam's Sweet Treats & Coffee</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/index.css`** (Tailwind v4 import + brand tokens; tune hex values to the logo later)

```css
@import "tailwindcss";

@theme {
  --color-cream: #fff7ef;
  --color-cocoa: #5b3a29;
  --color-caramel: #c98a4b;
  --color-berry: #d4607a;
}

html, body, #root { height: 100%; }
body { margin: 0; background: var(--color-cream); color: var(--color-cocoa); }
```

- [ ] **Step 7: Create `src/App.tsx`** (placeholder; router added in Task 5)

```tsx
export default function App() {
  return <div className="p-8 text-2xl">Sam's Sweet Treats &amp; Coffee</div>
}
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Update `.gitignore`** (currently contains only `scratch`)

```
scratch
node_modules
dist
*.local
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: completes, creates `node_modules/` and `package-lock.json`, no peer-dep errors that block install.

- [ ] **Step 12: Verify build + dev server boot**

Run: `npm run build`
Expected: PASS — `tsc -b` reports no errors and Vite writes `dist/index.html` + assets.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html src .gitignore
git commit -m "chore: scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Move brand assets into the app

**Files:**
- Move: `images/*.jpg` → `public/images/`

- [ ] **Step 1: Move the images folder into `public/`**

```bash
mkdir -p public/images
git mv images/sam-cinnamon-rolls.jpg public/images/sam-cinnamon-rolls.jpg
git mv images/sams-logo.jpg public/images/sams-logo.jpg
git mv images/sams-trail-2.jpg public/images/sams-trail-2.jpg
git mv images/sams-trailer-1.jpg public/images/sams-trailer-1.jpg
git mv images/sam-treat-1.jpg public/images/sam-treat-1.jpg
git mv images/sam-treat-2.jpg public/images/sam-treat-2.jpg
git mv images/sam-treat-3.jpg public/images/sam-treat-3.jpg
git mv images/sam-treat-4.jpg public/images/sam-treat-4.jpg
git mv images/sam-treat-5.jpg public/images/sam-treat-5.jpg
git mv images/sam-treat-6.jpg public/images/sam-treat-6.jpg
```

- [ ] **Step 2: Verify the files resolve at the public path**

Run: `ls public/images`
Expected: all 10 `.jpg` files listed. (At runtime they're served at `./images/<name>.jpg`.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: move brand images into public/images"
```

---

### Task 3: Firebase initialization

**Files:**
- Create: `src/lib/firebase.ts`
- Delete: root `firebase.ts` (superseded)

- [ ] **Step 1: Create `src/lib/firebase.ts`** (config copied from the existing root `firebase.ts`; export Auth + Firestore, drop Analytics which breaks in SSR/test contexts)

```ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDSyWaLtKXa9qve42c3L9sAZ7Mw0KuMdR8',
  authDomain: 'samssweet.firebaseapp.com',
  projectId: 'samssweet',
  storageBucket: 'samssweet.firebasestorage.app',
  messagingSenderId: '962904517776',
  appId: '1:962904517776:web:da9f6e0a5a3fcbbcea3c15',
  measurementId: 'G-698LHXPQC8',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

> Note: the Firebase web config is not secret — it identifies the project to the client and is safe to commit. Access control is enforced by Firestore security rules (Task 11), not by hiding these keys.

- [ ] **Step 2: Delete the superseded root config**

```bash
git rm firebase.ts
```

- [ ] **Step 3: Verify it type-checks**

Run: `npx tsc -b`
Expected: PASS — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "feat: initialize firebase auth and firestore"
```

---

### Task 4: Menu types + pure utilities (TDD)

**Files:**
- Create: `src/lib/menuTypes.ts`
- Create: `src/lib/menuUtils.ts`
- Test: `src/lib/menuUtils.test.ts`

- [ ] **Step 1: Create `src/lib/menuTypes.ts`**

```ts
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
```

- [ ] **Step 2: Write the failing test `src/lib/menuUtils.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import type { MenuItem } from './menuTypes'
import { formatPrice, sortItems, groupByCategory, availableItems } from './menuUtils'

const item = (over: Partial<MenuItem>): MenuItem => ({
  id: 'x',
  name: 'Item',
  description: '',
  price: 1,
  category: 'Treats',
  available: true,
  sortOrder: 0,
  ...over,
})

describe('formatPrice', () => {
  it('formats whole dollars with cents', () => {
    expect(formatPrice(4)).toBe('$4.00')
  })
  it('formats fractional dollars', () => {
    expect(formatPrice(4.5)).toBe('$4.50')
  })
})

describe('sortItems', () => {
  it('sorts by sortOrder then name', () => {
    const a = item({ id: 'a', name: 'Zed', sortOrder: 1 })
    const b = item({ id: 'b', name: 'Abe', sortOrder: 2 })
    const c = item({ id: 'c', name: 'Mid', sortOrder: 1 })
    const sorted = sortItems([b, a, c]).map((i) => i.id)
    // sortOrder 1 group ordered by name (Mid < Zed), then sortOrder 2
    expect(sorted).toEqual(['c', 'a', 'b'])
  })
})

describe('availableItems', () => {
  it('keeps only available items', () => {
    const a = item({ id: 'a', available: true })
    const b = item({ id: 'b', available: false })
    expect(availableItems([a, b]).map((i) => i.id)).toEqual(['a'])
  })
})

describe('groupByCategory', () => {
  it('groups items by category in first-seen order, sorted within group', () => {
    const coffee1 = item({ id: 'c1', category: 'Coffee', sortOrder: 2 })
    const treat1 = item({ id: 't1', category: 'Treats', sortOrder: 1 })
    const coffee2 = item({ id: 'c2', category: 'Coffee', sortOrder: 1 })
    const groups = groupByCategory([coffee1, treat1, coffee2])
    expect(groups.map((g) => g.category)).toEqual(['Coffee', 'Treats'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['c2', 'c1'])
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- run src/lib/menuUtils.test.ts`
Expected: FAIL — `menuUtils` module / its exports not found.

- [ ] **Step 4: Implement `src/lib/menuUtils.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- run src/lib/menuUtils.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/menuTypes.ts src/lib/menuUtils.ts src/lib/menuUtils.test.ts
git commit -m "feat: add menu types and pure menu utilities with tests"
```

---

### Task 5: Firestore menu CRUD wrappers

**Files:**
- Create: `src/lib/menu.ts`

> These are thin wrappers over the Firebase SDK. They contain no branching logic worth unit-testing in isolation (mocking would just re-assert the SDK), so they're verified via the hook/component tests in later tasks and a manual smoke test. Keep them thin so they stay trivially correct.

- [ ] **Step 1: Create `src/lib/menu.ts`**

```ts
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
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b`
Expected: PASS — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/menu.ts
git commit -m "feat: add firestore menu CRUD wrappers"
```

---

### Task 6: `useMenu` hook (TDD with mocked Firebase)

**Files:**
- Create: `src/hooks/useMenu.ts`
- Test: `src/hooks/useMenu.test.tsx`

- [ ] **Step 1: Write the failing test `src/hooks/useMenu.test.tsx`** (mock `../lib/menu` so the hook is tested without Firebase)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const unsubscribe = vi.fn()
let capturedCb: ((items: MenuItem[]) => void) | null = null

vi.mock('../lib/menu', () => ({
  subscribeMenu: (cb: (items: MenuItem[]) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useMenu } from './useMenu'

describe('useMenu', () => {
  beforeEach(() => {
    capturedCb = null
    unsubscribe.mockClear()
  })

  it('starts loading then exposes items from the subscription', async () => {
    const { result } = renderHook(() => useMenu())
    expect(result.current.loading).toBe(true)

    const items: MenuItem[] = [
      { id: '1', name: 'Latte', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 0 },
    ]
    act(() => capturedCb!(items))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual(items)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useMenu())
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- run src/hooks/useMenu.test.tsx`
Expected: FAIL — `useMenu` module / export not found.

- [ ] **Step 3: Implement `src/hooks/useMenu.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- run src/hooks/useMenu.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMenu.ts src/hooks/useMenu.test.tsx
git commit -m "feat: add useMenu realtime hook with tests"
```

---

### Task 7: Menu UI components (TDD)

**Files:**
- Create: `src/components/MenuItemCard.tsx`
- Create: `src/components/MenuList.tsx`
- Test: `src/components/MenuList.test.tsx`

- [ ] **Step 1: Create `src/components/MenuItemCard.tsx`**

```tsx
import type { MenuItem } from '../lib/menuTypes'
import { formatPrice } from '../lib/menuUtils'

export default function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-caramel/30">
      <div>
        <p className="font-semibold text-cocoa">{item.name}</p>
        {item.description && (
          <p className="text-sm text-cocoa/70">{item.description}</p>
        )}
      </div>
      <span className="font-semibold text-caramel whitespace-nowrap">
        {formatPrice(item.price)}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Write the failing test `src/components/MenuList.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MenuList from './MenuList'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: 'Espresso + milk', price: 4.5, category: 'Coffee', available: true, sortOrder: 1 },
  { id: '2', name: 'Drip', description: '', price: 3, category: 'Coffee', available: false, sortOrder: 0 },
  { id: '3', name: 'Cinnamon Roll', description: '', price: 5, category: 'Treats', available: true, sortOrder: 0 },
]

describe('MenuList', () => {
  it('renders available items grouped by category and hides unavailable', () => {
    render(<MenuList items={items} />)
    expect(screen.getByRole('heading', { name: 'Coffee' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Treats' })).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Cinnamon Roll')).toBeInTheDocument()
    // unavailable "Drip" is hidden
    expect(screen.queryByText('Drip')).not.toBeInTheDocument()
  })

  it('shows an empty message when nothing is available', () => {
    render(<MenuList items={[]} />)
    expect(screen.getByText(/menu coming soon/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- run src/components/MenuList.test.tsx`
Expected: FAIL — `MenuList` module not found.

- [ ] **Step 4: Implement `src/components/MenuList.tsx`**

```tsx
import type { MenuItem } from '../lib/menuTypes'
import { availableItems, groupByCategory } from '../lib/menuUtils'
import MenuItemCard from './MenuItemCard'

export default function MenuList({ items }: { items: MenuItem[] }) {
  const groups = groupByCategory(availableItems(items))

  if (groups.length === 0) {
    return <p className="text-cocoa/70 italic">Menu coming soon — check back!</p>
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="text-2xl font-bold text-berry mb-2">{group.category}</h3>
          <div>
            {group.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- run src/components/MenuList.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 6: Commit**

```bash
git add src/components/MenuItemCard.tsx src/components/MenuList.tsx src/components/MenuList.test.tsx
git commit -m "feat: add menu list and item card components with tests"
```

---

### Task 8: Router + page skeletons

**Files:**
- Create: `src/pages/Home.tsx`, `src/pages/TvMenu.tsx`, `src/pages/Admin.tsx`
- Modify: `src/App.tsx` (replace placeholder with router)

- [ ] **Step 1: Create `src/pages/Home.tsx`** (skeleton; fleshed out in Task 9)

```tsx
export default function Home() {
  return <main className="p-8">Home</main>
}
```

- [ ] **Step 2: Create `src/pages/TvMenu.tsx`** (skeleton; fleshed out in Task 10)

```tsx
export default function TvMenu() {
  return <main className="p-8">TV Menu</main>
}
```

- [ ] **Step 3: Create `src/pages/Admin.tsx`** (skeleton; fleshed out in Task 12)

```tsx
export default function Admin() {
  return <main className="p-8">Admin</main>
}
```

- [ ] **Step 4: Replace `src/App.tsx` with the router** (HashRouter — required for GitHub Pages, which has no SPA path rewriting)

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TvMenu from './pages/TvMenu'
import Admin from './pages/Admin'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tv" element={<TvMenu />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS — `tsc -b` clean, Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages
git commit -m "feat: add hash router and page skeletons"
```

---

### Task 9: Home page content

**Files:**
- Modify: `src/pages/Home.tsx`
- Test: `src/pages/Home.test.tsx`

Home reads the live menu via `useMenu` and renders `MenuList`, plus hero/about/photos and external links (Toast ordering + socials — the "Linktree" requirement, done inline as a simple link list).

- [ ] **Step 1: Write the failing test `src/pages/Home.test.tsx`** (mock `useMenu` so no Firebase is needed)

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))

import Home from './Home'

describe('Home', () => {
  it('renders the business name and the live menu', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/sam's sweet/i)
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('renders an order-ahead link to Toast', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /order ahead/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('toast'))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- run src/pages/Home.test.tsx`
Expected: FAIL — current `Home` renders only "Home"; assertions fail.

- [ ] **Step 3: Implement `src/pages/Home.tsx`** (replace the skeleton). Replace `TOAST_ORDER_URL` with the real Toast online-ordering URL once known; placeholder host is fine for now and keeps the test passing.

```tsx
import { useMenu } from '../hooks/useMenu'
import MenuList from '../components/MenuList'

// TODO: replace with Sam's real Toast online-ordering link when available
const TOAST_ORDER_URL = 'https://www.toasttab.com/'

const links = [
  { label: 'Order Ahead', href: TOAST_ORDER_URL },
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'Facebook', href: 'https://facebook.com/' },
]

const photos = [
  'sams-trailer-1.jpg',
  'sam-cinnamon-rolls.jpg',
  'sam-treat-1.jpg',
  'sams-trail-2.jpg',
]

export default function Home() {
  const { items, loading } = useMenu()

  return (
    <main className="min-h-full">
      {/* Hero */}
      <header className="flex flex-col items-center text-center gap-4 py-12 px-6 bg-cocoa text-cream">
        <img
          src="./images/sams-logo.jpg"
          alt="Sam's Sweet Treats & Coffee logo"
          className="w-40 h-40 rounded-full object-cover shadow-lg"
        />
        <h1 className="text-4xl font-extrabold">Sam's Sweet Treats &amp; Coffee</h1>
        <p className="max-w-xl text-cream/90">
          Fresh coffee and handmade treats from our trailer. Find us on the trail!
        </p>
        <nav className="flex flex-wrap justify-center gap-3 pt-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-full bg-berry text-white font-semibold hover:opacity-90"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Menu */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-cocoa mb-6">Menu</h2>
        {loading ? (
          <p className="text-cocoa/70 italic">Loading menu…</p>
        ) : (
          <MenuList items={items} />
        )}
      </section>

      {/* Gallery */}
      <section className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-2 md:grid-cols-4 gap-3">
        {photos.map((p) => (
          <img
            key={p}
            src={`./images/${p}`}
            alt=""
            className="aspect-square w-full object-cover rounded-lg"
          />
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- run src/pages/Home.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "feat: build home page with hero, live menu, links, gallery"
```

---

### Task 10: TV menu page

**Files:**
- Modify: `src/pages/TvMenu.tsx`
- Test: `src/pages/TvMenu.test.tsx`

Large-type, high-contrast, two-column landscape layout for a Samsung TV. Reads the same live menu (real-time updates) and hides unavailable items. Not linked from the public nav (reachable only via `#/tv`).

- [ ] **Step 1: Write the failing test `src/pages/TvMenu.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from '../lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
  { id: '2', name: 'Old Brew', description: '', price: 2, category: 'Coffee', available: false, sortOrder: 1 },
]
vi.mock('../hooks/useMenu', () => ({
  useMenu: () => ({ items, loading: false }),
}))

import TvMenu from './TvMenu'

describe('TvMenu', () => {
  it('shows available items and hides unavailable ones', () => {
    render(<TvMenu />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('$4.50')).toBeInTheDocument()
    expect(screen.queryByText('Old Brew')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- run src/pages/TvMenu.test.tsx`
Expected: FAIL — current `TvMenu` renders only "TV Menu".

- [ ] **Step 3: Implement `src/pages/TvMenu.tsx`**

```tsx
import { useMenu } from '../hooks/useMenu'
import { availableItems, groupByCategory, formatPrice } from '../lib/menuUtils'

export default function TvMenu() {
  const { items, loading } = useMenu()
  const groups = groupByCategory(availableItems(items))

  return (
    <main className="min-h-screen bg-cocoa text-cream p-10">
      <div className="flex items-center gap-6 mb-10">
        <img
          src="./images/sams-logo.jpg"
          alt=""
          className="w-24 h-24 rounded-full object-cover"
        />
        <h1 className="text-6xl font-extrabold">Sam's Sweet Treats &amp; Coffee</h1>
      </div>

      {loading ? (
        <p className="text-4xl">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-16 gap-y-10">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="text-5xl font-bold text-caramel mb-4">
                {group.category}
              </h2>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-4xl">
                    <span>{item.name}</span>
                    <span className="font-semibold">{formatPrice(item.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- run src/pages/TvMenu.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TvMenu.tsx src/pages/TvMenu.test.tsx
git commit -m "feat: build landscape TV menu page"
```

---

### Task 11: Auth wrappers, `useAuth`, Login, ProtectedRoute (TDD)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/Login.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Test: `src/hooks/useAuth.test.tsx`, `src/components/ProtectedRoute.test.tsx`

- [ ] **Step 1: Create `src/lib/auth.ts`** (thin wrappers over Firebase Auth)

```ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

export function signIn(email: string, password: string): Promise<unknown> {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

export function subscribeAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onChange)
}
```

- [ ] **Step 2: Write the failing test `src/hooks/useAuth.test.tsx`** (mock `../lib/auth`)

```tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { User } from 'firebase/auth'

let capturedCb: ((u: User | null) => void) | null = null
const unsubscribe = vi.fn()
vi.mock('../lib/auth', () => ({
  subscribeAuth: (cb: (u: User | null) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('starts loading, then reports the signed-in user', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)

    act(() => capturedCb!({ uid: 'u1' } as User))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.uid).toBe('u1')
  })

  it('reports null when signed out', async () => {
    const { result } = renderHook(() => useAuth())
    act(() => capturedCb!(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- run src/hooks/useAuth.test.tsx`
Expected: FAIL — `useAuth` not found.

- [ ] **Step 4: Implement `src/hooks/useAuth.ts`**

```ts
import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { subscribeAuth } from '../lib/auth'

export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return { user, loading }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- run src/hooks/useAuth.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 6: Create `src/components/Login.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold text-cocoa">Admin Login</h1>
        <label className="block">
          <span className="text-sm text-cocoa/70">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        {error && <p className="text-berry text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 rounded bg-cocoa text-cream font-semibold disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 7: Write the failing test `src/components/ProtectedRoute.test.tsx`** (mock `../hooks/useAuth`)

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))
vi.mock('./Login', () => ({ default: () => <div>Login Form</div> }))

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  it('shows a loading state while auth resolves', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('shows the login form when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText('Login Form')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders children when signed in', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npm run test -- run src/components/ProtectedRoute.test.tsx`
Expected: FAIL — `ProtectedRoute` not found.

- [ ] **Step 9: Implement `src/components/ProtectedRoute.tsx`**

```tsx
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import Login from './Login'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <main className="p-8 text-cocoa/70">Loading…</main>
  }
  if (!user) {
    return <Login />
  }
  return <>{children}</>
}
```

- [ ] **Step 10: Run both auth tests to verify they pass**

Run: `npm run test -- run src/hooks/useAuth.test.tsx src/components/ProtectedRoute.test.tsx`
Expected: PASS — all green.

- [ ] **Step 11: Commit**

```bash
git add src/lib/auth.ts src/hooks/useAuth.ts src/hooks/useAuth.test.tsx src/components/Login.tsx src/components/ProtectedRoute.tsx src/components/ProtectedRoute.test.tsx
git commit -m "feat: add auth wrappers, useAuth, login, and protected route"
```

---

### Task 12: Admin menu editor

**Files:**
- Modify: `src/pages/Admin.tsx`
- Test: `src/pages/Admin.test.tsx`

Admin wraps its content in `ProtectedRoute`. Inside: a sign-out button, a table of all items (including unavailable), an availability toggle, edit/delete buttons, and an add form. CRUD calls go through `src/lib/menu.ts`.

- [ ] **Step 1: Write the failing test `src/pages/Admin.test.tsx`** (force signed-in via `useAuth` mock; mock the menu hook + CRUD lib)

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MenuItem } from '../lib/menuTypes'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}))

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({ useMenu: () => ({ items, loading: false }) }))

const addMenuItem = vi.fn().mockResolvedValue(undefined)
const updateMenuItem = vi.fn().mockResolvedValue(undefined)
const deleteMenuItem = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/menu', () => ({
  addMenuItem: (...a: unknown[]) => addMenuItem(...a),
  updateMenuItem: (...a: unknown[]) => updateMenuItem(...a),
  deleteMenuItem: (...a: unknown[]) => deleteMenuItem(...a),
}))

import Admin from './Admin'

describe('Admin', () => {
  it('lists existing items including their availability', () => {
    render(<Admin />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
  })

  it('adds a new item from the form', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.type(screen.getByLabelText(/name/i), 'Mocha')
    await user.type(screen.getByLabelText(/category/i), 'Coffee')
    await user.type(screen.getByLabelText(/price/i), '5')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mocha', category: 'Coffee', price: 5, available: true }),
    )
  })

  it('toggles availability of an existing item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /hide/i }))
    expect(updateMenuItem).toHaveBeenCalledWith('1', { available: false })
  })

  it('deletes an item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('1')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- run src/pages/Admin.test.tsx`
Expected: FAIL — current `Admin` renders only "Admin".

- [ ] **Step 3: Implement `src/pages/Admin.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useMenu } from '../hooks/useMenu'
import { addMenuItem, updateMenuItem, deleteMenuItem } from '../lib/menu'
import { signOutUser } from '../lib/auth'
import { formatPrice } from '../lib/menuUtils'
import type { NewMenuItem } from '../lib/menuTypes'

const empty: NewMenuItem = {
  name: '',
  description: '',
  price: 0,
  category: '',
  available: true,
  sortOrder: 0,
}

function AdminInner() {
  const { items } = useMenu()
  const [form, setForm] = useState<NewMenuItem>(empty)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    await addMenuItem(form)
    setForm(empty)
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cocoa">Menu Admin</h1>
        <button onClick={() => signOutUser()} className="text-berry underline">
          Sign out
        </button>
      </div>

      {/* Existing items */}
      <table className="w-full mb-10 text-left">
        <thead>
          <tr className="border-b border-caramel/40 text-cocoa/70 text-sm">
            <th className="py-2">Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-caramel/20">
              <td className="py-2">{item.name}</td>
              <td>{item.category}</td>
              <td>{formatPrice(item.price)}</td>
              <td>{item.available ? 'Available' : 'Hidden'}</td>
              <td className="space-x-3 text-sm">
                <button
                  onClick={() =>
                    updateMenuItem(item.id, { available: !item.available })
                  }
                  className="text-caramel"
                >
                  {item.available ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="text-berry"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-3 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-cocoa">Add item</h2>
        <label className="block">
          <span className="text-sm text-cocoa/70">Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Description</span>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Category</span>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Price</span>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Sort order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 rounded bg-cocoa text-cream font-semibold"
        >
          Add item
        </button>
      </form>
    </main>
  )
}

export default function Admin() {
  return (
    <ProtectedRoute>
      <AdminInner />
    </ProtectedRoute>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- run src/pages/Admin.test.tsx`
Expected: PASS — all four tests green.

- [ ] **Step 5: Run the full suite + build**

Run: `npm run test -- run`
Expected: PASS — every test file green.
Run: `npm run build`
Expected: PASS — clean type-check and Vite build.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Admin.tsx src/pages/Admin.test.tsx
git commit -m "feat: build admin menu editor with add/toggle/delete"
```

---

### Task 13: Firestore security rules + seed script

**Files:**
- Create: `firestore.rules`
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create `firestore.rules`** (public read of the menu; writes only for authenticated admins)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menuItems/{item} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Create `scripts/seed.ts`** (one-off seeder using the client SDK; signs in with admin creds passed as env vars so the writes pass the rules)

```ts
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
```

- [ ] **Step 3: Manual setup (one-time, done in the Firebase console / CLI — document, do not block)**

In the Firebase console for project `samssweet`:
1. **Authentication → Sign-in method →** enable **Email/Password**.
2. **Authentication → Users → Add user →** create Sam's admin account (email + password).
3. **Firestore Database →** create the database (production mode).
4. **Firestore → Rules →** paste the contents of `firestore.rules` and Publish.

Then seed:
Run: `ADMIN_EMAIL=<admin email> ADMIN_PASSWORD=<admin password> npx tsx scripts/seed.ts`
Expected: prints "Added …" for each item then "Seed complete." (or "already has N docs — skipping" on re-run).

- [ ] **Step 4: Verify type-check**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules scripts/seed.ts
git commit -m "feat: add firestore security rules and seed script"
```

---

### Task 14: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`** (build with Node, publish `dist/` via the official Pages actions)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test -- run
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Sam's Sweet Treats & Coffee

Single-page marketing/info site for the coffee & treat trailer, plus a TV menu and an admin menu editor. React + Vite + TypeScript + Tailwind, backed by Firebase (Firestore + Auth), deployed to GitHub Pages.

## Routes
- `/` — public home + interactive menu (`#/`)
- `/tv` — landscape menu for the trailer TV (`#/tv`, not linked publicly)
- `/admin` — auth-protected Firestore menu editor (`#/admin`)

## Develop
```bash
npm install
npm run dev      # local dev server
npm run test     # watch tests (npm run test -- run for CI mode)
npm run build    # type-check + production build to dist/
```

## Firebase setup
Enable Email/Password auth, create the admin user, create Firestore, and publish `firestore.rules`. Seed sample data:
```bash
ADMIN_EMAIL=<admin> ADMIN_PASSWORD=<password> npx tsx scripts/seed.ts
```

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml` (test → build → GitHub Pages).
In the repo: **Settings → Pages → Source: GitHub Actions**.

## Custom domain (later)
When connecting the Squarespace domain, add a `public/CNAME` file containing the bare domain (e.g. `samssweet.com`) and configure DNS per GitHub's Pages docs. The Vite `base: './'` setting already supports both the project-page URL and a custom domain.
```

- [ ] **Step 3: Verify the workflow file is valid YAML and the build command it calls works locally**

Run: `npm run build`
Expected: PASS (already verified in Task 12; confirms the CI build step will succeed).

- [ ] **Step 4: Manual repo setting (one-time, document — does not block)**

In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: deploy to github pages via actions"
```

---

## Self-Review

**Spec coverage** (from `scratch/prompt.md` + `scratch/notes.md`):
- Informational single-page site → Task 9 (Home). ✅
- Images/logo theming → Task 2 (moved to `public/images`), used in Tasks 9–10 + theme tokens in Task 1. ✅
- Interactive menu in the customer site → Task 7 (`MenuList`) + Task 9 (Home renders it live). ✅
- Menu can be a separate page → also surfaced full-screen on `/tv` (Task 10). ✅
- Admin route, private + auth-protected, edits Firestore menu → Tasks 11 (auth/gate) + 12 (editor) + 13 (rules). ✅
- TV (landscape Samsung) menu, Firebase-backed, not auth-protected, not publicly linked → Task 10 (`#/tv`, omitted from nav). ✅
- Firebase Firestore + email/password auth → Tasks 3, 5, 11, 13. ✅
- GitHub Pages hosting → Task 14 (Actions deploy, `base: './'`, HashRouter). ✅
- Squarespace custom domain later → documented in Task 14 README (CNAME note). ✅
- Toast as POS / future integration → linked externally on Home (Task 9), no server integration, explicitly deferred. ✅
- Linktree → links list in the Home hero (Task 9). ✅

**Placeholder scan:** No "TBD"/"add error handling"/"write tests for the above" left. The one intentional `TODO` (`TOAST_ORDER_URL`) has a concrete working default so tests pass; real URL slots in later. Firebase-console and GitHub-Pages steps are explicitly flagged as one-time manual setup, not code placeholders.

**Type consistency:** `MenuItem`/`NewMenuItem` (Task 4) are used unchanged in `menu.ts`, `useMenu`, components, `Admin`, and `seed.ts`. Function names are stable across tasks: `subscribeMenu`/`addMenuItem`/`updateMenuItem`/`deleteMenuItem` (menu.ts), `signIn`/`signOutUser`/`subscribeAuth` (auth.ts), `formatPrice`/`sortItems`/`groupByCategory`/`availableItems` (menuUtils.ts). Collection name `menuItems` matches between `menu.ts`, `firestore.rules`, and `seed.ts`. ✅
