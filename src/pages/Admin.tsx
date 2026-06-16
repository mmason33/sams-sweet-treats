import { useMemo, useState, type FormEvent } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import Modal from '../components/Modal'
import { useMenu } from '../hooks/useMenu'
import { addMenuItem, updateMenuItem, deleteMenuItem } from '../lib/menu'
import { signOutUser } from '../lib/auth'
import { formatPrice } from '../lib/menuUtils'
import type { MenuItem, NewMenuItem } from '../lib/menuTypes'

const empty: NewMenuItem = {
  name: '',
  description: '',
  price: 0,
  category: '',
  available: true,
  sortOrder: 0,
}

type SortKey = 'name' | 'category'
type SortDir = 'asc' | 'desc'

function AdminInner() {
  const { items } = useMenu()
  const [form, setForm] = useState<NewMenuItem>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('category')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? items.filter(
          (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
        )
      : items
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const primary = a[sortKey].localeCompare(b[sortKey]) * dir
      // Stable secondary sort so equal keys stay grouped sensibly.
      return primary || a.name.localeCompare(b.name)
    })
  }, [items, search, sortKey, sortDir])

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
      await addMenuItem(form)
    }
    closeForm()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteMenuItem(deleteTarget.id)
    setDeleteTarget(null)
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '')

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

      {/* Items table */}
      <div className="overflow-x-auto rounded-xl border border-caramel/20 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-caramel/30 text-xs uppercase tracking-wide text-cocoa/60">
              <th className="px-4 py-3">
                <button onClick={() => toggleSort('name')} className="font-semibold hover:text-cocoa">
                  Name <span className="text-berry">{sortArrow('name')}</span>
                </button>
              </th>
              <th className="px-4 py-3">
                <button onClick={() => toggleSort('category')} className="font-semibold hover:text-cocoa">
                  Category <span className="text-berry">{sortArrow('category')}</span>
                </button>
              </th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-cocoa/50">
                  No items match “{search}”.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.id} className="border-b border-caramel/15 last:border-0 hover:bg-blush-soft/40">
                  <td className="px-4 py-3 font-medium text-cocoa">{item.name}</td>
                  <td className="px-4 py-3 text-cocoa/70">{item.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-cocoa">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                        (item.available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-cocoa/10 text-cocoa/60')
                      }
                    >
                      {item.available ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      <button onClick={() => openEdit(item)} className="text-cocoa hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => updateMenuItem(item.id, { available: !item.available })}
                        className="text-caramel hover:underline"
                      >
                        {item.available ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="text-berry hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
          <div className="flex gap-3">
            <label className="block flex-1">
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
            <label className="block flex-1">
              <span className="text-sm text-cocoa/70">Sort order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
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
