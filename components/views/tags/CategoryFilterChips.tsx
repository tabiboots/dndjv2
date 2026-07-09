'use client'

import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Category } from '@/lib/contexts/TagDataContext'

function SortableChip({
  cat, index, onRequestDelete,
}: {
  cat: Category & { count: number }
  index: number
  onRequestDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative shrink-0"
    >
      <span
        {...attributes}
        {...listeners}
        className={`jiggle flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-700 whitespace-nowrap cursor-grab active:cursor-grabbing select-none transition-opacity ${
          isDragging ? 'opacity-25' : 'opacity-100'
        }`}
        style={{ animationDelay: `${(index * 47) % 180}ms` }}
      >
        {cat.name} <span className="text-[10px] text-gray-400 ml-0.5">{cat.count}</span>
      </span>
  <button
        onPointerDown={e => e.stopPropagation()}
        onClick={() => onRequestDelete(cat.id)}
        className="absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full bg-gray-500 text-white flex items-center justify-center text-[9px] leading-none hover:bg-red-400 transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export default function CategoryFilterChips({
  categories,
  totalCount,
  active,
  onToggle,
  onClear,
  onCreate,
  onReorder,
  onDelete,
}: {
  categories: (Category & { count: number })[]
  totalCount: number
  active: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  onCreate: (name: string) => Promise<unknown>
  onReorder: (fromId: string, toId: string) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) onReorder(active.id as string, over.id as string)
  }

  const submit = async () => {
    const name = input.trim()
    if (name) await onCreate(name)
    setInput('')
    setAdding(false)
  }

  const confirmingCat = confirmDeleteId ? categories.find(c => c.id === confirmDeleteId) : null

  const chipClass = (isActive: boolean) =>
    `shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors ${
      isActive
        ? 'bg-gray-200 border border-white shadow-inner text-black'
        : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
    }`

  return (
    <>
      {confirmingCat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-black">Delete "{confirmingCat.name}"?</p>
            <p className="text-xs text-gray-500">The category will be removed. Tags inside it won't be deleted.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-1.5 rounded-xl bg-gray-100 border border-gray-300 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmingCat.id); setConfirmDeleteId(null) }}
                className="flex-1 py-1.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto bg-gray-200 scrollbar-none shrink-0">
        {!editing && (
          <button onClick={onClear} className={chipClass(active.size === 0)}>
            All <span className="text-[10px] text-gray-400 ml-0.5">{totalCount}</span>
          </button>
        )}

        {editing ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis, restrictToParentElement]}>
            <SortableContext items={categories.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex items-center gap-1.5">
                {categories.map((cat, i) => (
                  <SortableChip key={cat.id} cat={cat} index={i} onRequestDelete={setConfirmDeleteId} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          categories.map(cat => (
            <button key={cat.id} onClick={() => onToggle(cat.id)} className={chipClass(active.has(cat.id))}>
              {cat.name} <span className="text-[10px] text-gray-400 ml-0.5">{cat.count}</span>
            </button>
          ))
        )}

        {adding ? (
          <form onSubmit={e => { e.preventDefault(); submit() }} className="shrink-0">
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setInput('') } }}
              onBlur={submit}
              placeholder="Name..."
              className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-300 text-xs text-black outline-none placeholder:text-gray-400 w-24"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="shrink-0 px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            + New
          </button>
        )}

        <button
          onClick={() => setEditing(e => !e)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors ml-auto ${
            editing
              ? 'bg-gray-800 border border-gray-700 text-white'
              : 'bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
    </>
  )
}
