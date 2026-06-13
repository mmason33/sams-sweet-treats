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
