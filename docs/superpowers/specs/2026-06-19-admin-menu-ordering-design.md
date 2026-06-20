# Admin Menu Ordering — Design

**Date:** 2026-06-19
**Status:** Approved (pending implementation plan)

## Problem

The admin page controls menu item order through a numeric `sortOrder` text field,
which is unintuitive. Category order is a hardcoded list (`CATEGORY_ORDER` in
`src/lib/menuUtils.ts`) that the admin cannot change without a code edit. The
admin table's name/category column sort is view-only and does not affect the
public Home menu or the TV menu.

Goal: let the admin order both **items** and **categories** by drag-and-drop, and
remove the numeric `sortOrder` field. The Home page and TV menu must reflect the
saved order.

## Scope

In scope:
- Drag-and-drop reordering of items within a category (persisted).
- Drag-and-drop reordering of categories themselves (persisted).
- Remove the `sortOrder` form field from the add/edit modal.
- Home + TV menus consume the persisted category order.

Out of scope:
- Cross-category item drag (moving an item to a different category is done by
  editing the item's category field, as today).
- Changing category names via drag (rename stays an item-edit concern).
- Reordering while a search filter is active.

## Approach

Chosen: **reuse `sortOrder` for within-category order + a single config doc for
category order.** Rejected alternatives: fractional ranks/lexorank (benefit only
at hundreds+ of items), and central ordered-ID arrays per category (couples every
add/delete to a config-doc write). The menu is small (dozens of items), so
rewriting a category's items on drop is cheap.

Drag library: **`@dnd-kit`** (`@dnd-kit/core`, `@dnd-kit/sortable`,
`@dnd-kit/utilities`). Chosen for accessible pointer + touch + keyboard support
(touch matters for managing the menu from a phone/tablet). `react-beautiful-dnd`
is rejected (unmaintained).

## Data Model

- `MenuItem.sortOrder: number` — unchanged field, but now purely drag-derived.
  Within a category, values are the row indices `0,1,2,…`. The existing
  `sortItems` (`a.sortOrder - b.sortOrder || a.name.localeCompare`) keeps working.
- New Firestore doc `config/menu` with shape `{ categoryOrder: string[] }`.
  - Holds the ordered list of category names.
  - Missing doc or a category absent from the array → that category sorts to the
    end (preserves today's "unknown categories last" behavior). This guarantees
    nothing breaks before the doc is first written or when a brand-new category
    name is introduced via item edit.

### Firestore rules

Add a `config` match alongside the existing `menuItems` rule:

```
match /config/{doc} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

Public read (Home/TV need the category order); authenticated write (admin only).
**Operational note:** there is no Firebase CLI deploy wired up in this repo, so
after merging, the rules must be re-published by hand in the Firebase console
(Firestore → Rules → Publish), same as the previous rules change.

## Components / Changes

### `src/lib/menu.ts` (and/or a new `src/lib/config.ts`)
- `subscribeCategoryOrder(onChange: (order: string[]) => void): () => void` —
  realtime subscription to `config/menu`.
- `saveCategoryOrder(order: string[]): Promise<void>` — write the array.
- `reorderItems(items: MenuItem[]): Promise<void>` — batched write assigning
  `sortOrder = index` to each item in the given order (one category's items).
- `addMenuItem` appends: new item gets `sortOrder = (max in its category) + 1`.
  The modal no longer supplies `sortOrder`.

### `src/lib/menuUtils.ts`
- Replace the hardcoded `CATEGORY_ORDER` constant usage in `orderGroups` with a
  passed-in `categoryOrder: string[]`. Signature becomes
  `orderGroups(groups, categoryOrder)`; unknown categories still rank last.
- Keep `CATEGORY_ORDER` only as the seed/default the import script uses.

### `src/hooks/useMenu.ts` (or a new `useCategoryOrder` hook)
- Expose the category order to consumers so Home and TV can call
  `orderGroups(groups, categoryOrder)`.

### `src/components/MenuList.tsx` (Home) and `src/pages/TvMenu.tsx`
- Read category order from the hook and pass it to `orderGroups`. No other
  behavior change.

### `src/pages/Admin.tsx`
- Replace the view-only sortable table with a list grouped by category in saved
  order.
- Category sections are sortable (drag handle on the header) → on drop, persist
  via `saveCategoryOrder`.
- Items within a category are sortable (drag handle on the row) → on drop,
  persist via `reorderItems` for that category.
- Remove the `sortOrder` field from the add/edit modal.
- Search becomes find-only: when a query is present, render flat filtered results
  with drag disabled; clearing the search restores the draggable grouped view.
- Keep Edit / Hide-Show / Delete per row.

## Data Flow

1. Admin drops an item → local optimistic reorder → `reorderItems` batched write
   → Firestore `onSnapshot` confirms → all clients (Home, TV) update live.
2. Admin drops a category → `saveCategoryOrder` writes `config/menu` →
   `subscribeCategoryOrder` pushes new order → Home/TV re-rank via `orderGroups`.
3. Admin adds an item with a new category name → item appears; its category is
   absent from `categoryOrder` so it ranks last until dragged.

## Error Handling

- Writes are awaited; on failure, surface the error and let the next `onSnapshot`
  reconcile the optimistic local state back to server truth (drag snaps back).
- Missing/empty `config/menu` → treated as empty `categoryOrder` (all categories
  rank last among themselves, ordered by name) so the app still renders.

## Testing

- `menuUtils`: `orderGroups(groups, categoryOrder)` — known order respected;
  unknown categories last; empty/missing order falls back to name sort.
- `menu`/config lib: `reorderItems` assigns sequential `sortOrder`;
  `addMenuItem` appends to category end; `saveCategoryOrder` round-trips
  (mocked Firestore).
- Admin: renders grouped-by-category; modal no longer shows a sort-order field;
  search shows flat filtered results with drag disabled. Drag interactions
  themselves are covered at the reducer/handler level (compute next order from a
  from/to index) rather than simulating pointer drags in jsdom.
- Existing Home/TV tests updated to pass a `categoryOrder` where needed.

## Risks / Notes

- Rules must be re-published manually after merge (no CLI deploy).
- `@dnd-kit` adds three small dependencies.
- jsdom can't realistically simulate drag; ordering logic is extracted into pure
  functions so it's unit-testable without the DOM.
