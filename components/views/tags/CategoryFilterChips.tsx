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
}: {
  categories: (Category & { count: number })[]
  totalCount: number
  active: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  onCreate: (name: string) => Promise<unknown>
}) {
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
    <div className="flex items-center gap-1.5 px-3 pt-3 overflow-x-auto scrollbar-none shrink-0">
      <button onClick={onClear} className={chipClass(active.size === 0)}>
        All <span className="text-[10px] text-gray-400 ml-0.5">{totalCount}</span>
      </button>
      {categories.map(cat => (
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
          + New category
        </button>
      )}
    </div>
  )
}
