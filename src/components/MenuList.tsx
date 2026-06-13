import type { MenuItem } from '../lib/menuTypes'
import { availableItems, groupByCategory } from '../lib/menuUtils'
import MenuItemCard from './MenuItemCard'

export default function MenuList({ items }: { items: MenuItem[] }) {
  const groups = groupByCategory(availableItems(items))

  if (groups.length === 0) {
    return <p className="text-cocoa/70 italic">Menu coming soon — check back!</p>
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="text-2xl font-bold text-berry mb-2">{group.category}</h3>
          <div>
            {group.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
