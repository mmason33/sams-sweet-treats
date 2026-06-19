import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import type { MenuItem } from '../lib/menuTypes'
import { reorderArray, formatPrice, type MenuGroup } from '../lib/menuUtils'
import { GripIcon } from './icons'

type DraggableMenuProps = {
  groups: MenuGroup[]
  onReorderCategories: (nextOrder: string[]) => void
  onReorderItems: (category: string, nextItems: MenuItem[]) => void
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export default function DraggableMenu({
  groups,
  onReorderCategories,
  onReorderItems,
  onEdit,
  onToggle,
  onDelete,
}: DraggableMenuProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const categoryIds = groups.map((g) => g.category)

  function handleCategoryDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = categoryIds.indexOf(String(active.id))
    const to = categoryIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorderCategories(reorderArray(categoryIds, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
      <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {groups.map((group) => (
            <CategorySection
              key={group.category}
              group={group}
              onReorderItems={onReorderItems}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function CategorySection({
  group,
  onReorderItems,
  onEdit,
  onToggle,
  onDelete,
}: {
  group: MenuGroup
  onReorderItems: (category: string, nextItems: MenuItem[]) => void
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.category,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const itemIds = group.items.map((i) => i.id)

  function handleItemDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = itemIds.indexOf(String(active.id))
    const to = itemIds.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorderItems(group.category, reorderArray(group.items, from, to))
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-caramel/20 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${group.category} category`}
          className="cursor-grab touch-none text-cocoa/40 hover:text-cocoa"
        >
          <GripIcon className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-cocoa">{group.category}</h2>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <SortableItemRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  )
}

function SortableItemRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-blush-soft/40"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.name}`}
        className="cursor-grab touch-none text-cocoa/40 hover:text-cocoa"
      >
        <GripIcon className="h-5 w-5" />
      </button>
      <span className="flex-1 font-medium text-cocoa">{item.name}</span>
      <span className="tabular-nums text-cocoa/70">{formatPrice(item.price)}</span>
      <span
        className={
          'rounded-full px-2 py-0.5 text-xs font-medium ' +
          (item.available ? 'bg-green-100 text-green-700' : 'bg-cocoa/10 text-cocoa/60')
        }
      >
        {item.available ? 'Available' : 'Hidden'}
      </span>
      <button onClick={() => onEdit(item)} className="text-cocoa hover:underline">
        Edit
      </button>
      <button onClick={() => onToggle(item)} className="text-caramel hover:underline">
        {item.available ? 'Hide' : 'Show'}
      </button>
      <button onClick={() => onDelete(item)} className="text-berry hover:underline">
        Delete
      </button>
    </li>
  )
}
