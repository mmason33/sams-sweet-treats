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
  renameCategoryItems,
} from '../lib/menu'
import { saveCategoryOrder } from '../lib/config'
import { signOutUser } from '../lib/auth'
import { buildCategoryGroups, formatItemPrice } from '../lib/menuUtils'
import { PencilIcon, EyeIcon, EyeOffIcon, TrashIcon } from '../components/icons'
import type { MenuItem, NewMenuItem } from '../lib/menuTypes'

const empty: NewMenuItem = {
  name: '',
  description: '',
  price: 0,
  category: '',
  available: true,
  sortOrder: 0,
}

type CatModal = { mode: 'add' | 'rename'; original: string }

function AdminInner() {
  const { items } = useMenu()
  const { savedCategories } = useCategoryOrder()
  const [form, setForm] = useState<NewMenuItem>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [search, setSearch] = useState('')
  const [catModal, setCatModal] = useState<CatModal | null>(null)
  const [catName, setCatName] = useState('')

  const groups = useMemo(
    () => buildCategoryGroups(items, savedCategories),
    [items, savedCategories],
  )
  const categoryNames = useMemo(() => groups.map((g) => g.category), [groups])

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
    setForm({ ...empty, category: categoryNames[0] ?? '' })
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      largePrice: item.largePrice,
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
    const { largePrice, ...rest } = form
    const lp = largePrice != null && largePrice > 0 ? largePrice : undefined
    if (editingId) {
      await updateMenuItem(editingId, { ...rest, largePrice: lp })
    } else {
      // Append the new item to the end of its category.
      const inCategory = items.filter((i) => i.category === rest.category)
      const sortOrder = inCategory.length
        ? Math.max(...inCategory.map((i) => i.sortOrder)) + 1
        : 0
      await addMenuItem({ ...rest, largePrice: lp, sortOrder })
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

  function openAddCategory() {
    setCatModal({ mode: 'add', original: '' })
    setCatName('')
  }

  function openRenameCategory(category: string) {
    setCatModal({ mode: 'rename', original: category })
    setCatName(category)
  }

  async function submitCategory(e: FormEvent) {
    e.preventDefault()
    if (!catModal) return
    const name = catName.trim()
    // Ignore empty names and collisions with a different existing category.
    if (!name || (name !== catModal.original && categoryNames.includes(name))) return

    if (catModal.mode === 'add') {
      await saveCategoryOrder([...categoryNames, name])
    } else {
      const original = catModal.original
      const itemsInCategory = items.filter((i) => i.category === original)
      if (itemsInCategory.length) await renameCategoryItems(itemsInCategory, name)
      await saveCategoryOrder(categoryNames.map((c) => (c === original ? name : c)))
    }
    setCatModal(null)
  }

  function deleteCategory(category: string) {
    // Only reachable for empty categories (the row hides Delete otherwise).
    void saveCategoryOrder(categoryNames.filter((c) => c !== category))
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
          type="button"
          onClick={openAddCategory}
          className="rounded-lg border border-cocoa/30 px-4 py-2 font-semibold text-cocoa hover:bg-blush-soft/50"
        >
          Add category
        </button>
        <button
          type="button"
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
            <p className="py-6 text-center text-cocoa/50">No items match "{search}".</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-blush-soft/40"
                >
                  <span className="flex-1 font-medium text-cocoa">{item.name}</span>
                  <span className="text-cocoa/60">{item.category}</span>
                  <span className="tabular-nums text-cocoa/70">{formatItemPrice(item)}</span>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    title="Edit"
                    className="rounded p-1.5 text-cocoa hover:bg-cocoa/10"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAvailable(item)}
                    aria-label={`${item.available ? 'Hide' : 'Show'} ${item.name}`}
                    title={item.available ? 'Hide' : 'Show'}
                    className="rounded p-1.5 text-caramel hover:bg-caramel/10"
                  >
                    {item.available ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete ${item.name}`}
                    title="Delete"
                    className="rounded p-1.5 text-berry hover:bg-berry/10"
                  >
                    <TrashIcon className="h-5 w-5" />
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
          onRenameCategory={openRenameCategory}
          onDeleteCategory={deleteCategory}
          onEdit={openEdit}
          onToggle={toggleAvailable}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Add / edit item modal */}
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
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="mt-1 w-full rounded border border-caramel/40 bg-white px-3 py-2"
            >
              {categoryNames.length === 0 && <option value="">Add a category first</option>}
              {categoryNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="text-sm text-cocoa/70">Regular price</span>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
                className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
              />
            </label>
            <label className="block flex-1">
              <span className="text-sm text-cocoa/70">Large price (optional)</span>
              <input
                type="number"
                step="0.01"
                value={form.largePrice ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    largePrice: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
              />
            </label>
          </div>
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

      {/* Add / rename category modal */}
      <Modal
        open={!!catModal}
        onClose={() => setCatModal(null)}
        title={catModal?.mode === 'rename' ? 'Rename category' : 'Add category'}
      >
        <form onSubmit={submitCategory} className="space-y-3">
          <label className="block">
            <span className="text-sm text-cocoa/70">Category name</span>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
              autoFocus
              className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
            />
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCatModal(null)}
              className="rounded border border-cocoa/30 px-4 py-2 font-semibold text-cocoa"
            >
              Cancel
            </button>
            <button type="submit" className="rounded bg-cocoa px-4 py-2 font-semibold text-cream">
              {catModal?.mode === 'rename' ? 'Save' : 'Add category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete item?">
        <p className="text-cocoa/80">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This can't be undone.
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
