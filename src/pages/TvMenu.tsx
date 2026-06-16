import { useEffect, useState } from 'react'
import { useMenu } from '../hooks/useMenu'
import { useFullscreen } from '../hooks/useFullscreen'
import { useWakeLock } from '../hooks/useWakeLock'
import { useIdleCursor } from '../hooks/useIdleCursor'
import { ExpandIcon, CompressIcon } from '../components/icons'
import {
  availableItems,
  groupByCategory,
  orderGroups,
  paginateGroups,
  formatPrice,
} from '../lib/menuUtils'

const ROTATE_MS = 7500
const ITEMS_PER_BOARD = 16 // ~7 per column across two columns

export default function TvMenu() {
  const { items, loading } = useMenu()
  const groups = orderGroups(groupByCategory(availableItems(items)))
  const boards = paginateGroups(groups, ITEMS_PER_BOARD)
  const [page, setPage] = useState(0)

  const { isFullscreen, supported: fullscreenSupported, toggle: toggleFullscreen } = useFullscreen()
  const cursorIdle = useIdleCursor(4000)
  useWakeLock(true) // keep the TV screen from dimming/sleeping

  // Advance through the boards on a timer; restart if the board count shrinks.
  useEffect(() => {
    if (boards.length <= 1) return
    const id = setInterval(() => setPage((p) => (p + 1) % boards.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [boards.length])

  const current = boards[Math.min(page, Math.max(boards.length - 1, 0))] ?? []

  return (
    <main
      className={
        'flex min-h-screen flex-col bg-cocoa p-10 text-cream ' +
        (cursorIdle ? 'cursor-none' : '')
      }
    >
      {fullscreenSupported && (
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={
            'fixed right-5 top-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20 ' +
            (cursorIdle ? 'pointer-events-none opacity-0' : 'opacity-100')
          }
        >
          {isFullscreen ? <CompressIcon className="h-6 w-6" /> : <ExpandIcon className="h-6 w-6" />}
        </button>
      )}

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
          {/* Center the board vertically so sparse slides don't bottom-out.
              CSS columns: whole categories flow down one column then the next
              (break-inside-avoid keeps a category intact). */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="columns-2 gap-x-16 [&>section]:mb-10 [&>section]:break-inside-avoid">
              {current.map((group) => (
                <section key={group.category}>
                  <h2 className="mb-4 text-4xl font-bold tracking-tight text-blush">
                    {group.category}
                  </h2>
                  <ul className="space-y-3">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex items-end gap-2 text-3xl">
                        <span className="leading-tight">{item.name}</span>
                        {/* dotted leader fills the gap between name and price */}
                        <span
                          aria-hidden="true"
                          className="mb-1.5 flex-1 border-b-2 border-dotted border-cream/25"
                        />
                        <span className="shrink-0 font-semibold leading-tight tabular-nums text-blush">
                          {formatPrice(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
