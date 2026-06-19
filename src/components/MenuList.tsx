import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '../lib/menuTypes'
import { availableItems, groupByCategory, orderGroups } from '../lib/menuUtils'
import MenuItemCard from './MenuItemCard'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

const ALL = '__all__'

export default function MenuList({
  items,
  categoryOrder,
}: {
  items: MenuItem[]
  categoryOrder?: string[]
}) {
  const groups = orderGroups(groupByCategory(availableItems(items)), categoryOrder)
  const [active, setActive] = useState<string>('')

  // Horizontal scroll control for the pill strip (arrows on desktop).
  const stripRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function updateArrows() {
    const el = stripRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 1)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [items])

  function scrollStrip(dir: -1 | 1) {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  if (groups.length === 0) {
    return <p className="text-cocoa/70 italic">Menu coming soon — check back!</p>
  }

  // Default to the first category so the page opens compact, not as a wall.
  const categories = groups.map((g) => g.category)
  const current = active === ALL || categories.includes(active) ? active : categories[0]
  const visible = current === ALL ? groups : groups.filter((g) => g.category === current)

  const pill = (key: string, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setActive(key)}
      aria-pressed={current === key}
      className={
        'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ' +
        (current === key
          ? 'bg-berry text-cream shadow-sm'
          : 'bg-blush-soft text-cocoa/80 hover:bg-blush')
      }
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Category filter pills — sticky just below the floating nav.
          Single swipeable row on mobile; arrow buttons scroll it on desktop. */}
      <div className="sticky top-20 z-30 -mx-6 mb-6 bg-cream/90 px-6 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            disabled={!canLeft}
            aria-label="Scroll categories left"
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-cocoa transition hover:bg-blush-soft disabled:opacity-30 disabled:hover:bg-transparent sm:grid"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div
            ref={stripRef}
            onScroll={updateArrows}
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pill(ALL, 'All')}
            {categories.map((c) => pill(c, c))}
          </div>

          <button
            type="button"
            onClick={() => scrollStrip(1)}
            disabled={!canRight}
            aria-label="Scroll categories right"
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-cocoa transition hover:bg-blush-soft disabled:opacity-30 disabled:hover:bg-transparent sm:grid"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {visible.map((group) => (
          <section key={group.category}>
            <h3 className="mb-2 text-2xl font-bold text-berry">{group.category}</h3>
            <div>
              {group.items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
