import { useMenu } from '../hooks/useMenu'
import { availableItems, groupByCategory, formatPrice } from '../lib/menuUtils'

export default function TvMenu() {
  const { items, loading } = useMenu()
  const groups = groupByCategory(availableItems(items))

  return (
    <main className="min-h-screen bg-cocoa text-cream p-10">
      <div className="flex items-center gap-6 mb-10">
        <img
          src={`${import.meta.env.BASE_URL}images/sams-logo.jpg`}
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
