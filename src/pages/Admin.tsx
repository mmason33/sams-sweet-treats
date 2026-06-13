import { useState, type FormEvent } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
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

function AdminInner() {
  const { items } = useMenu()
  const [form, setForm] = useState<NewMenuItem>(empty)
  const [editingId, setEditingId] = useState<string | null>(null)

  function startEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      sortOrder: item.sortOrder,
    })
    setEditingId(item.id)
  }

  function resetForm() {
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
    resetForm()
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cocoa">Menu Admin</h1>
        <button onClick={() => signOutUser()} className="text-berry underline">
          Sign out
        </button>
      </div>

      {/* Existing items */}
      <table className="mb-10 w-full text-left">
        <thead>
          <tr className="border-b border-caramel/40 text-sm text-cocoa/70">
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
              <td className="space-x-3 whitespace-nowrap text-sm">
                <button onClick={() => startEdit(item)} className="text-cocoa hover:underline">
                  Edit
                </button>
                <button
                  onClick={() => updateMenuItem(item.id, { available: !item.available })}
                  className="text-caramel hover:underline"
                >
                  {item.available ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="text-berry hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add / edit form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-cocoa">
          {editingId ? 'Edit item' : 'Add item'}
        </h2>
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
        <label className="block">
          <span className="text-sm text-cocoa/70">Sort order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="mt-1 w-full rounded border border-caramel/40 px-3 py-2"
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded bg-cocoa py-2 font-semibold text-cream"
          >
            {editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-cocoa/30 px-4 py-2 font-semibold text-cocoa"
            >
              Cancel
            </button>
          )}
        </div>
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
