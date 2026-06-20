# Admin Menu Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin drag-and-drop to order both menu categories and the items within them, replacing the numeric `sortOrder` field, with the Home and TV menus reflecting the saved order.

**Architecture:** Within-category item order keeps using the existing `MenuItem.sortOrder` number (now drag-derived). Category order moves out of the hardcoded `CATEGORY_ORDER` constant into a Firestore `config/menu` doc (`{ categoryOrder: string[] }`), read live by a `useCategoryOrder` hook and consumed by Home/TV/Admin. The Admin page renders a grouped, draggable list built on `@dnd-kit`; drops persist via a batched `sortOrder` write (items) and a config-doc write (categories).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind v4, Firebase Firestore (web SDK v10), Vitest + React Testing Library, `@dnd-kit` (`core`, `sortable`, `utilities`).

## Global Constraints

- Test runner: `npx vitest run` (one-shot; `npm test` is watch mode). Typecheck/build: `npm run build` (`tsc && vite build`).
- All commits end with the trailer (on its own line, after a blank line):
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Firestore collection for items is `menuItems`; config doc is `config/menu`.
- Drag mechanics use `@dnd-kit` only. No `react-beautiful-dnd`.
- Cross-category item drag is OUT of scope — items only reorder within their own category.
- jsdom cannot simulate pointer drag; ordering logic lives in the pure `reorderArray` helper (unit-tested). Component tests verify structure/handlers, not live drags.
- Thin Firestore wrappers (`saveCategoryOrder`, `subscribeCategoryOrder`, `reorderItems`) follow the existing repo convention (like `subscribeMenu`/`addMenuItem` in `src/lib/menu.ts`): not unit-tested directly, exercised through hooks/components with the lib mocked.
- ⚠️ Operational: there is no Firebase CLI deploy in this repo. After merge, `firestore.rules` must be re-published by hand in the Firebase console (Firestore → Rules → Publish).

---

## File Structure

- `src/lib/menuUtils.ts` (modify) — add `reorderArray`; make `orderGroups` accept a `categoryOrder` array (default `CATEGORY_ORDER`).
- `src/lib/menuUtils.test.ts` (modify) — tests for `reorderArray` and parameterized `orderGroups`.
- `src/lib/config.ts` (create) — `subscribeCategoryOrder`, `saveCategoryOrder` (thin Firestore wrappers).
- `src/lib/menu.ts` (modify) — add `reorderItems` (batched `sortOrder` write).
- `src/hooks/useCategoryOrder.ts` (create) — live category order with fallback to `CATEGORY_ORDER`.
- `src/hooks/useCategoryOrder.test.tsx` (create) — hook test (mocks `../lib/config`).
- `src/components/icons.tsx` (modify) — add `GripIcon`.
- `src/components/MenuList.tsx` (modify) — accept optional `categoryOrder` prop.
- `src/pages/Home.tsx` (modify) — feed `useCategoryOrder` into `MenuList`.
- `src/pages/TvMenu.tsx` (modify) — feed `useCategoryOrder` into `orderGroups`.
- `src/pages/Home.test.tsx`, `src/pages/TvMenu.test.tsx` (modify) — mock `../hooks/useCategoryOrder`.
- `src/components/DraggableMenu.tsx` (create) — grouped draggable list (categories + items).
- `src/components/DraggableMenu.test.tsx` (create) — structure + callback tests.
- `src/pages/Admin.tsx` (modify) — grouped draggable UI, remove `sortOrder` field, search find-only.
- `src/pages/Admin.test.tsx` (modify) — rewrite for the new UI.
- `firestore.rules` (modify) — add `config` match.
- `package.json` (modify) — add `@dnd-kit` deps.

---

## Task 1: Pure ordering helpers

**Files:**
- Modify: `src/lib/menuUtils.ts`
- Test: `src/lib/menuUtils.test.ts`

**Interfaces:**
- Consumes: existing `MenuGroup`, `MenuItem`, `CATEGORY_ORDER`.
- Produces:
  - `reorderArray<T>(list: T[], from: number, to: number): T[]` — returns a new array with the element at `from` moved to `to`.
  - `orderGroups(groups: MenuGroup[], categoryOrder?: string[]): MenuGroup[]` — orders by the given category list (defaults to `CATEGORY_ORDER`); categories not in the list sort last, alphabetically.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/menuUtils.test.ts`. Update the import line to include `reorderArray`:

```ts
import {
  formatPrice,
  sortItems,
  groupByCategory,
  availableItems,
  orderGroups,
  paginateGroups,
  reorderArray,
} from './menuUtils'
```

Append these describe blocks at the end of the file:

```ts
describe('reorderArray', () => {
  it('moves an element forward', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })
  it('moves an element backward', () => {
    expect(reorderArray(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })
  it('does not mutate the input', () => {
    const input = ['a', 'b', 'c']
    reorderArray(input, 0, 2)
    expect(input).toEqual(['a', 'b', 'c'])
  })
})

describe('orderGroups with a custom category order', () => {
  it('respects the provided order over the canonical default', () => {
    const g = (category: string) => ({ category, items: [] })
    const ordered = orderGroups([g('Coffee'), g('Treats')], ['Treats', 'Coffee'])
    expect(ordered.map((x) => x.category)).toEqual(['Treats', 'Coffee'])
  })
  it('sorts categories missing from the order list last, alphabetically', () => {
    const g = (category: string) => ({ category, items: [] })
    const ordered = orderGroups([g('Zebra'), g('Apple'), g('Treats')], ['Treats'])
    expect(ordered.map((x) => x.category)).toEqual(['Treats', 'Apple', 'Zebra'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/menuUtils.test.ts`
Expected: FAIL — `reorderArray is not a function`, and the custom-order `orderGroups` call ignores the second argument.

- [ ] **Step 3: Implement in `src/lib/menuUtils.ts`**

Add `reorderArray` (place near the top, after `formatPrice`):

```ts
/** Return a new array with the item at `from` moved to index `to`. Pure. */
export function reorderArray<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
```

Replace the existing `orderGroups` function with a parameterized version:

```ts
export function orderGroups(
  groups: MenuGroup[],
  categoryOrder: string[] = CATEGORY_ORDER,
): MenuGroup[] {
  const rank = (c: string) => {
    const i = categoryOrder.indexOf(c)
    return i === -1 ? categoryOrder.length : i
  }
  return [...groups].sort(
    (a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category),
  )
}
```

(Keep the `CATEGORY_ORDER` export exactly as-is; it remains the default and the import-script seed.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/menuUtils.test.ts`
Expected: PASS (all blocks, including the pre-existing canonical-order test which still passes because the default param is `CATEGORY_ORDER`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/menuUtils.ts src/lib/menuUtils.test.ts
git commit -m "feat: add reorderArray and parameterized orderGroups"
```

---

## Task 2: Category-order persistence + hook + rules

**Files:**
- Create: `src/lib/config.ts`
- Modify: `src/lib/menu.ts`
- Create: `src/hooks/useCategoryOrder.ts`
- Test: `src/hooks/useCategoryOrder.test.tsx`
- Modify: `firestore.rules`

**Interfaces:**
- Consumes: `db` from `src/lib/firebase.ts`; `MenuItem` from `src/lib/menuTypes.ts`; `CATEGORY_ORDER` from `src/lib/menuUtils.ts`.
- Produces:
  - `subscribeCategoryOrder(onChange: (order: string[]) => void): () => void` — live `config/menu` `categoryOrder` array (empty array if the doc/field is missing).
  - `saveCategoryOrder(order: string[]): Promise<void>` — merge-writes `{ categoryOrder }` to `config/menu`.
  - `reorderItems(orderedItems: MenuItem[]): Promise<void>` — batched write setting each item's `sortOrder` to its index in the array.
  - `useCategoryOrder(): { categoryOrder: string[]; loading: boolean }` — returns the live order, or `CATEGORY_ORDER` when none is saved yet.

- [ ] **Step 1: Create `src/lib/config.ts`**

```ts
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
```

- [ ] **Step 2: Add `reorderItems` to `src/lib/menu.ts`**

Add `writeBatch` to the existing `firebase/firestore` import:

```ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  writeBatch,
} from 'firebase/firestore'
```

Append at the end of the file:

```ts
/** Persist a new within-category order by writing each item's index as sortOrder. */
export async function reorderItems(orderedItems: MenuItem[]): Promise<void> {
  const batch = writeBatch(db)
  orderedItems.forEach((item, index) => {
    batch.update(doc(db, COLLECTION, item.id), { sortOrder: index })
  })
  await batch.commit()
}
```

- [ ] **Step 3: Write the failing hook test**

Create `src/hooks/useCategoryOrder.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { CATEGORY_ORDER } from '../lib/menuUtils'

const unsubscribe = vi.fn()
let capturedCb: ((order: string[]) => void) | null = null

vi.mock('../lib/config', () => ({
  subscribeCategoryOrder: (cb: (order: string[]) => void) => {
    capturedCb = cb
    return unsubscribe
  },
}))

import { useCategoryOrder } from './useCategoryOrder'

describe('useCategoryOrder', () => {
  beforeEach(() => {
    capturedCb = null
    unsubscribe.mockClear()
  })

  it('starts loading then exposes the saved order', async () => {
    const { result } = renderHook(() => useCategoryOrder())
    expect(result.current.loading).toBe(true)
    act(() => capturedCb!(['Treats', 'Coffee']))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categoryOrder).toEqual(['Treats', 'Coffee'])
  })

  it('falls back to the canonical order when none is saved', async () => {
    const { result } = renderHook(() => useCategoryOrder())
    act(() => capturedCb!([]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categoryOrder).toEqual(CATEGORY_ORDER)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useCategoryOrder())
    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useCategoryOrder.test.tsx`
Expected: FAIL — cannot resolve `./useCategoryOrder`.

- [ ] **Step 5: Implement `src/hooks/useCategoryOrder.ts`**

```ts
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
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useCategoryOrder.test.tsx`
Expected: PASS.

- [ ] **Step 7: Update `firestore.rules`**

Replace the file contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menuItems/{item} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /config/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/config.ts src/lib/menu.ts src/hooks/useCategoryOrder.ts src/hooks/useCategoryOrder.test.tsx firestore.rules
git commit -m "feat: persist category order in config doc with useCategoryOrder hook"
```

---

## Task 3: Wire Home, TV, and MenuList to the saved category order

**Files:**
- Modify: `src/components/MenuList.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/TvMenu.tsx`
- Modify: `src/pages/Home.test.tsx`
- Modify: `src/pages/TvMenu.test.tsx`

**Interfaces:**
- Consumes: `useCategoryOrder` (Task 2), `orderGroups(groups, categoryOrder?)` (Task 1).
- Produces: `MenuList` now accepts `categoryOrder?: string[]`.

- [ ] **Step 1: Add the mock to `src/pages/Home.test.tsx`**

Home.test renders `<Home />`, which will now call `useCategoryOrder` (and thus the real Firestore subscription) unless mocked. Add this mock alongside the existing `useMenu` mock near the top of the file (after the imports):

```tsx
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: [], loading: false }),
}))
```

If the file does not already import `vi`, add it to the `vitest` import.

- [ ] **Step 2: Add the mock to `src/pages/TvMenu.test.tsx`**

Add the same mock near the existing `useMenu` mock:

```tsx
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: [], loading: false }),
}))
```

- [ ] **Step 3: Run the existing Home/TV tests to confirm they still pass with the mocks**

Run: `npx vitest run src/pages/Home.test.tsx src/pages/TvMenu.test.tsx`
Expected: PASS (mocks are inert until the components import the hook in the next steps; the mock of a not-yet-imported module is harmless).

- [ ] **Step 4: Add the `categoryOrder` prop to `src/components/MenuList.tsx`**

Change the component signature and the `orderGroups` call. Replace:

```tsx
export default function MenuList({ items }: { items: MenuItem[] }) {
  const groups = orderGroups(groupByCategory(availableItems(items)))
```

with:

```tsx
export default function MenuList({
  items,
  categoryOrder,
}: {
  items: MenuItem[]
  categoryOrder?: string[]
}) {
  const groups = orderGroups(groupByCategory(availableItems(items)), categoryOrder)
```

- [ ] **Step 5: Feed the hook into `src/pages/Home.tsx`**

Add the import:

```tsx
import { useCategoryOrder } from '../hooks/useCategoryOrder'
```

Inside the component, read it next to `useMenu`:

```tsx
  const { items, loading } = useMenu()
  const { categoryOrder } = useCategoryOrder()
```

Pass it to `MenuList` (in the Menu section):

```tsx
          <MenuList items={items} categoryOrder={categoryOrder} />
```

- [ ] **Step 6: Feed the hook into `src/pages/TvMenu.tsx`**

Add the import:

```tsx
import { useCategoryOrder } from '../hooks/useCategoryOrder'
```

Read it next to `useMenu` and pass it to `orderGroups`. Replace:

```tsx
  const { items, loading } = useMenu()
  const groups = orderGroups(groupByCategory(availableItems(items)))
```

with:

```tsx
  const { items, loading } = useMenu()
  const { categoryOrder } = useCategoryOrder()
  const groups = orderGroups(groupByCategory(availableItems(items)), categoryOrder)
```

- [ ] **Step 7: Run the affected tests**

Run: `npx vitest run src/pages/Home.test.tsx src/pages/TvMenu.test.tsx src/components/MenuList.test.tsx`
Expected: PASS. (MenuList.test passes no `categoryOrder`, so `orderGroups` uses its `CATEGORY_ORDER` default; Coffee/Treats aren't in it, so they rank last alphabetically → Coffee first, matching the existing "opens on the first category" assertion.)

- [ ] **Step 8: Commit**

```bash
git add src/components/MenuList.tsx src/pages/Home.tsx src/pages/TvMenu.tsx src/pages/Home.test.tsx src/pages/TvMenu.test.tsx
git commit -m "feat: order Home and TV menus by the saved category order"
```

---

## Task 4: DraggableMenu component + GripIcon + @dnd-kit

**Files:**
- Modify: `package.json`
- Modify: `src/components/icons.tsx`
- Create: `src/components/DraggableMenu.tsx`
- Test: `src/components/DraggableMenu.test.tsx`

**Interfaces:**
- Consumes: `reorderArray` (Task 1), `formatPrice`, `MenuGroup`, `MenuItem`.
- Produces: `DraggableMenu` with props:

```ts
type DraggableMenuProps = {
  groups: MenuGroup[] // already ordered: categories ranked, items sorted
  onReorderCategories: (nextOrder: string[]) => void
  onReorderItems: (category: string, nextItems: MenuItem[]) => void
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}
```

- [ ] **Step 1: Install @dnd-kit**

Run: `npm install @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3`
Expected: three packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Add `GripIcon` to `src/components/icons.tsx`**

Append before the final closing of the file (next to the other icon exports):

```tsx
export function GripIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}
```

- [ ] **Step 3: Write the failing component test**

Create `src/components/DraggableMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DraggableMenu from './DraggableMenu'
import type { MenuItem } from '../lib/menuTypes'
import type { MenuGroup } from '../lib/menuUtils'

const latte: MenuItem = { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 }
const americano: MenuItem = { id: '2', name: 'Americano', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 1 }
const brownie: MenuItem = { id: '3', name: 'Brownie', description: '', price: 3.95, category: 'Treats', available: false, sortOrder: 0 }

const groups: MenuGroup[] = [
  { category: 'Coffee', items: [latte, americano] },
  { category: 'Treats', items: [brownie] },
]

function renderMenu(overrides: Partial<React.ComponentProps<typeof DraggableMenu>> = {}) {
  const props = {
    groups,
    onReorderCategories: vi.fn(),
    onReorderItems: vi.fn(),
    onEdit: vi.fn(),
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<DraggableMenu {...props} />)
  return props
}

describe('DraggableMenu', () => {
  it('renders categories and their items', () => {
    renderMenu()
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Treats')).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Americano')).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('exposes drag handles for categories and items', () => {
    renderMenu()
    expect(screen.getByLabelText(/reorder coffee category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reorder latte/i)).toBeInTheDocument()
  })

  it('fires row callbacks', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    const row = screen.getByText('Latte').closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /edit/i }))
    expect(props.onEdit).toHaveBeenCalledWith(latte)
    await user.click(within(row).getByRole('button', { name: /hide/i }))
    expect(props.onToggle).toHaveBeenCalledWith(latte)
    await user.click(within(row).getByRole('button', { name: /delete/i }))
    expect(props.onDelete).toHaveBeenCalledWith(latte)
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/components/DraggableMenu.test.tsx`
Expected: FAIL — cannot resolve `./DraggableMenu`.

- [ ] **Step 5: Implement `src/components/DraggableMenu.tsx`**

```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import type { MenuItem } from '../lib/menuTypes'
import { reorderArray, formatPrice, type MenuGroup } from '../lib/menuUtils'
import { GripIcon } from './icons'

type DraggableMenuProps = {
  groups: MenuGroup[]
  onReorderCategories: (nextOrder: string[]) => void
  onReorderItems: (category: string, nextItems: MenuItem[]) => void
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export default function DraggableMenu({
  groups,
  onReorderCategories,
  onReorderItems,
  onEdit,
  onToggle,
  onDelete,
}: DraggableMenuProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const categoryIds = groups.map((g) => g.category)

  function handleCategoryDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = categoryIds.indexOf(String(active.id))
    const to = categoryIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorderCategories(reorderArray(categoryIds, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {groups.map((group) => (
            <CategorySection
              key={group.category}
              group={group}
              onReorderItems={onReorderItems}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function CategorySection({
  group,
  onReorderItems,
  onEdit,
  onToggle,
  onDelete,
}: {
  group: MenuGroup
  onReorderItems: (category: string, nextItems: MenuItem[]) => void
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.category,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const itemIds = group.items.map((i) => i.id)

  function handleItemDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = itemIds.indexOf(String(active.id))
    const to = itemIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorderItems(group.category, reorderArray(group.items, from, to))
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-caramel/20 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${group.category} category`}
          className="cursor-grab touch-none text-cocoa/40 hover:text-cocoa"
        >
          <GripIcon className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-cocoa">{group.category}</h2>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <SortableItemRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  )
}

function SortableItemRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-blush-soft/40"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.name}`}
        className="cursor-grab touch-none text-cocoa/40 hover:text-cocoa"
      >
        <GripIcon className="h-5 w-5" />
      </button>
      <span className="flex-1 font-medium text-cocoa">{item.name}</span>
      <span className="tabular-nums text-cocoa/70">{formatPrice(item.price)}</span>
      <span
        className={
          'rounded-full px-2 py-0.5 text-xs font-medium ' +
          (item.available ? 'bg-green-100 text-green-700' : 'bg-cocoa/10 text-cocoa/60')
        }
      >
        {item.available ? 'Available' : 'Hidden'}
      </span>
      <button onClick={() => onEdit(item)} className="text-cocoa hover:underline">
        Edit
      </button>
      <button onClick={() => onToggle(item)} className="text-caramel hover:underline">
        {item.available ? 'Hide' : 'Show'}
      </button>
      <button onClick={() => onDelete(item)} className="text-berry hover:underline">
        Delete
      </button>
    </li>
  )
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/components/DraggableMenu.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/icons.tsx src/components/DraggableMenu.tsx src/components/DraggableMenu.test.tsx
git commit -m "feat: add DraggableMenu component with @dnd-kit"
```

---

## Task 5: Rewrite Admin to use DraggableMenu

**Files:**
- Modify: `src/pages/Admin.tsx`
- Modify: `src/pages/Admin.test.tsx`

**Interfaces:**
- Consumes: `useMenu`, `useCategoryOrder`, `groupByCategory`, `orderGroups`, `reorderItems` (`../lib/menu`), `saveCategoryOrder` (`../lib/config`), `addMenuItem`/`updateMenuItem`/`deleteMenuItem`, `DraggableMenu`.
- Produces: the new Admin page (no public interface change; still `export default function Admin`).

- [ ] **Step 1: Rewrite `src/pages/Admin.test.tsx`**

Replace the entire file with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MenuItem } from '../lib/menuTypes'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}))

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
  { id: '2', name: 'Americano', description: '', price: 4, category: 'Coffee', available: true, sortOrder: 1 },
  { id: '3', name: 'Brownie', description: '', price: 3.95, category: 'Treats', available: false, sortOrder: 0 },
]
vi.mock('../hooks/useMenu', () => ({ useMenu: () => ({ items, loading: false }) }))
vi.mock('../hooks/useCategoryOrder', () => ({
  useCategoryOrder: () => ({ categoryOrder: ['Coffee', 'Treats'], loading: false }),
}))

const addMenuItem = vi.fn().mockResolvedValue(undefined)
const updateMenuItem = vi.fn().mockResolvedValue(undefined)
const deleteMenuItem = vi.fn().mockResolvedValue(undefined)
const reorderItems = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/menu', () => ({
  addMenuItem: (...a: unknown[]) => addMenuItem(...a),
  updateMenuItem: (...a: unknown[]) => updateMenuItem(...a),
  deleteMenuItem: (...a: unknown[]) => deleteMenuItem(...a),
  reorderItems: (...a: unknown[]) => reorderItems(...a),
}))

const saveCategoryOrder = vi.fn().mockResolvedValue(undefined)
vi.mock('../lib/config', () => ({
  saveCategoryOrder: (...a: unknown[]) => saveCategoryOrder(...a),
}))

import Admin from './Admin'

function rowFor(name: string) {
  return screen.getByText(name).closest('li') as HTMLElement
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists all items including hidden ones, grouped by category', () => {
    render(<Admin />)
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Treats')).toBeInTheDocument()
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('adds a new item, appending sortOrder to the end of its category', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/name/i), 'Mocha')
    await user.type(within(dialog).getByLabelText(/category/i), 'Coffee')
    await user.type(within(dialog).getByLabelText(/price/i), '5')
    await user.click(within(dialog).getByRole('button', { name: /add item/i }))
    // Coffee already has sortOrder 0 and 1, so the new item appends at 2.
    expect(addMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mocha', category: 'Coffee', price: 5, available: true, sortOrder: 2 }),
    )
  })

  it('does not show a sort order field in the modal', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByLabelText(/sort order/i)).not.toBeInTheDocument()
  })

  it('toggles availability of an existing item', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Latte')).getByRole('button', { name: /hide/i }))
    expect(updateMenuItem).toHaveBeenCalledWith('1', { available: false })
  })

  it('edits an existing item through the modal', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Latte')).getByRole('button', { name: /edit/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/name/i)).toHaveValue('Latte')
    const price = within(dialog).getByLabelText(/price/i)
    await user.clear(price)
    await user.type(price, '6')
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))
    expect(updateMenuItem).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Latte', category: 'Coffee', price: 6 }),
    )
    expect(addMenuItem).not.toHaveBeenCalled()
  })

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.click(within(rowFor('Brownie')).getByRole('button', { name: /delete/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument()
    expect(deleteMenuItem).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /delete/i }))
    expect(deleteMenuItem).toHaveBeenCalledWith('3')
  })

  it('search is find-only: filters items and disables drag handles', async () => {
    const user = userEvent.setup()
    render(<Admin />)
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'brown')
    expect(screen.getByText('Brownie')).toBeInTheDocument()
    expect(screen.queryByText('Latte')).not.toBeInTheDocument()
    // No drag handles while filtering.
    expect(screen.queryByLabelText(/reorder/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/pages/Admin.test.tsx`
Expected: FAIL — the current Admin renders a table (`<tr>`, sort-order field, no grouped `<li>` rows / drag handles).

- [ ] **Step 3: Rewrite `src/pages/Admin.tsx`**

```tsx
import { useMemo, useState, type FormEvent } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import Modal from '../components/Modal'
import DraggableMenu from '../components/DraggableMenu'
import { useMenu } from '../hooks/useMenu'
import { useCategoryOrder } from '../hooks/useCategoryOrder'
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderItems,
} from '../lib/menu'
import { saveCategoryOrder } from '../lib/config'
import { signOutUser } from '../lib/auth'
import { formatPrice, groupByCategory, orderGroups, reorderArray } from '../lib/menuUtils'
import type { MenuItem, NewMenuItem } from '../lib/menuTypes'

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
  const { categoryOrder } = useCategoryOrder()
  const [form, setForm] = useState<NewMenuItem>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [search, setSearch] = useState('')

  const groups = useMemo(
    () => orderGroups(groupByCategory(items), categoryOrder),
    [items, categoryOrder],
  )

  const query = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      query
        ? items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) || i.category.toLowerCase().includes(query),
          )
        : [],
    [items, query],
  )

  function openAdd() {
    setForm(empty)
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      sortOrder: item.sortOrder,
    })
    setEditingId(item.id)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setForm(empty)
    setEditingId(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editingId) {
      await updateMenuItem(editingId, form)
    } else {
      // Append the new item to the end of its category.
      const inCategory = items.filter((i) => i.category === form.category)
      const sortOrder = inCategory.length
        ? Math.max(...inCategory.map((i) => i.sortOrder)) + 1
        : 0
      await addMenuItem({ ...form, sortOrder })
    }
    closeForm()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteMenuItem(deleteTarget.id)
    setDeleteTarget(null)
  }

  function handleReorderItems(_category: string, nextItems: MenuItem[]) {
    void reorderItems(nextItems)
  }

  function handleReorderCategories(nextOrder: string[]) {
    void saveCategoryOrder(nextOrder)
  }

  function toggleAvailable(item: MenuItem) {
    void updateMenuItem(item.id, { available: !item.available })
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cocoa">Menu Admin</h1>
        <button onClick={() => signOutUser()} className="text-berry underline">
          Sign out
        </button>
      </div>

      {/* Toolbar: search + add */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          aria-label="Search menu"
          className="min-w-0 flex-1 rounded-lg border border-caramel/40 px-4 py-2 focus:border-berry focus:outline-none"
        />
        <button
          onClick={openAdd}
          className="rounded-lg bg-cocoa px-4 py-2 font-semibold text-cream hover:bg-cocoa/90"
        >
          Add item
        </button>
      </div>

      {query ? (
        // Find-only mode: flat filtered results, no drag.
        <div className="rounded-xl border border-caramel/20 bg-white p-4 shadow-sm">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-cocoa/50">No items match “{search}”.</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-blush-soft/40"
                >
                  <span className="flex-1 font-medium text-cocoa">{item.name}</span>
                  <span className="text-cocoa/60">{item.category}</span>
                  <span className="tabular-nums text-cocoa/70">{formatPrice(item.price)}</span>
                  <button onClick={() => openEdit(item)} className="text-cocoa hover:underline">
                    Edit
                  </button>
                  <button onClick={() => toggleAvailable(item)} className="text-caramel hover:underline">
                    {item.available ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="text-berry hover:underline">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <DraggableMenu
          groups={groups}
          onReorderCategories={handleReorderCategories}
          onReorderItems={handleReorderItems}
          onEdit={openEdit}
          onToggle={toggleAvailable}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Add / edit modal */}
      <Modal open={formOpen} onClose={closeForm} title={editingId ? 'Edit item' : 'Add item'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-cocoa/70">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-cocoa/70">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-cocoa/70">Category</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
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
              className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
            />
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded border border-cocoa/30 px-4 py-2 font-semibold text-cocoa"
            >
              Cancel
            </button>
            <button type="submit" className="rounded bg-cocoa px-4 py-2 font-semibold text-cream">
              {editingId ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete item?">
        <p className="text-cocoa/80">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This can’t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded border border-cocoa/30 px-4 py-2 font-semibold text-cocoa"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded bg-berry px-4 py-2 font-semibold text-cream hover:bg-berry/90"
          >
            Delete
          </button>
        </div>
      </Modal>
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

Note: `reorderArray` is imported but only used inside `DraggableMenu`; remove it from the Admin import if `tsc` flags it as unused. (It is listed here only if a future inline use appears — by default, delete `reorderArray` from the import line to keep the build clean.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/pages/Admin.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full test + build check**

Run: `npx vitest run`
Expected: PASS (all suites).

Run: `npm run build`
Expected: `tsc` clean (no unused-import errors), Vite build succeeds. If `tsc` reports `reorderArray` unused in `Admin.tsx`, delete it from that import line and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Admin.tsx src/pages/Admin.test.tsx
git commit -m "feat: drag-and-drop ordering in the menu admin"
```

---

## Post-implementation (manual, not a code task)

- Re-publish `firestore.rules` in the Firebase console (the new `config/menu` writes will be denied until then).
- First time the admin reorders categories, `config/menu` is created; until then Home/TV use the `CATEGORY_ORDER` fallback.

## Self-Review Notes

- **Spec coverage:** items drag (Task 4/5 + `reorderItems` Task 2), categories drag (Task 4/5 + `saveCategoryOrder` Task 2), `config/menu` doc + fallback (Task 2), rules (Task 2), `sortOrder` field removed (Task 5), search find-only with drag disabled (Task 5), Home/TV consume order (Task 3), `@dnd-kit` (Task 4). All covered.
- **Type consistency:** `reorderArray`, `orderGroups(groups, categoryOrder?)`, `subscribeCategoryOrder`/`saveCategoryOrder`/`reorderItems`, `useCategoryOrder` return shape, and `DraggableMenu` props are defined once and referenced consistently across tasks.
- **No placeholders:** every code step contains complete code; every command lists expected output.
