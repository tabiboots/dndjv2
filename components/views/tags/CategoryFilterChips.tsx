'use client'

import { useState } from 'react'
import type { Category } from '@/lib/contexts/TagDataContext'

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
  onReorder: (id: string, dir: -1 | 1) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')

  const submit = async () => {
    const name = input.trim()
    if (name) await onCreate(name)
    setInput('')
    setAdding(false)
  }

  const chipClass = (isActive: boolean) =>
    `shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors ${
      isActive
        ? 'bg-gray-200 border border-white shadow-inner text-black'
        : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
    }`

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto bg-gray-200 scrollbar-none shrink-0">
      {!editing && (
        <button onClick={onClear} className={chipClass(active.size === 0)}>
          All <span className="text-[10px] text-gray-400 ml-0.5">{totalCount}</span>
        </button>
      )}

      {categories.map((cat, i) => editing ? (
        <div key={cat.id} className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onReorder(cat.id, -1)}
            disabled={i === 0}
            className="text-gray-400 hover:text-black disabled:opacity-20 transition-colors px-0.5 text-sm leading-none"
          >
            ‹
          </button>
          <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-700 whitespace-nowrap">
            {cat.name} <span className="text-[10px] text-gray-400 ml-0.5">{cat.count}</span>
          </span>
          <button
            onClick={() => onReorder(cat.id, 1)}
            disabled={i === categories.length - 1}
            className="text-gray-400 hover:text-black disabled:opacity-20 transition-colors px-0.5 text-sm leading-none"
          >
            ›
          </button>
          <button
            onClick={() => onDelete(cat.id)}
            className="text-gray-300 hover:text-red-400 transition-colors ml-0.5 text-sm leading-none"
          >
            ×
          </button>
        </div>
      ) : (
        <button key={cat.id} onClick={() => onToggle(cat.id)} className={chipClass(active.has(cat.id))}>
          {cat.name} <span className="text-[10px] text-gray-400 ml-0.5">{cat.count}</span>
        </button>
      ))}

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
  )
}