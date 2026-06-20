import type { MenuItem } from '../lib/menuTypes'
import { formatItemPrice } from '../lib/menuUtils'

export default function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-caramel/30">
      <div>
        <p className="font-semibold text-cocoa">{item.name}</p>
        {item.description && (
          <p className="text-sm text-cocoa/70">{item.description}</p>
        )}
      </div>
      <span className="font-semibold text-caramel whitespace-nowrap">
        {formatItemPrice(item)}
      </span>
    </div>
  )
}
