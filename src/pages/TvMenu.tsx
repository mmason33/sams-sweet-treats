import { useEffect, useState } from 'react'
import { useMenu } from '../hooks/useMenu'
import {
  availableItems,
  groupByCategory,
  orderGroups,
  paginateGroups,
  formatPrice,
} from '../lib/menuUtils'

const ROTATE_MS = 10000
const ITEMS_PER_BOARD = 14 // ~7 per column across two columns

export default function TvMenu() {
  const { items, loading } = useMenu()
  const groups = orderGroups(groupByCategory(availableItems(items)))
  const boards = paginateGroups(groups, ITEMS_PER_BOARD)
  const [page, setPage] = useState(0)

  // Advance through the boards on a timer; restart if the board count shrinks.
  useEffect(() => {
    if (boards.length <= 1) return
    const id = setInterval(() => setPage((p) => (p + 1) % boards.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [boards.length])

  const current = boards[Math.min(page, Math.max(boards.length - 1, 0))] ?? []

  return (
    <main className="flex min-h-screen flex-col bg-cocoa p-10 text-cream">
      <div className="mb-8 flex items-center gap-6">
        <img
          src={`${import.meta.env.BASE_URL}images/sams-logo-icons.png`}
          alt=""
          className="h-24 w-24 rounded-full bg-cream object-contain p-1"
        />
        <h1 className="font-display text-6xl">Sam's Sweet Treats &amp; Coffee</h1>
      </div>

      {loading ? (
        <p className="text-4xl">Loading…</p>
      ) : (
        <>
          <div className="grid flex-1 auto-rows-min grid-cols-2 gap-x-16 gap-y-8 content-start">
            {current.map((group) => (
              <section key={group.category} className="break-inside-avoid">
                <h2 className="mb-3 text-4xl font-bold text-blush">{group.category}</h2>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-6 text-3xl">
                      <span>{item.name}</span>
                      <span className="font-semibold text-caramel">{formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Board progress dots */}
          {boards.length > 1 && (
            <div className="mt-8 flex justify-center gap-3">
              {boards.map((_, i) => (
                <span
                  key={i}
                  className={
                    'h-3 w-3 rounded-full transition ' +
                    (i === page % boards.length ? 'bg-blush' : 'bg-cream/25')
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
