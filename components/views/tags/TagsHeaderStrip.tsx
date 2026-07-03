'use client'

import { useEffect, useState } from 'react'
import SortMenu, { type TagSort } from '@/components/views/tags/SortMenu'

export default function TagsHeaderStrip({
  tagCount,
  categoryCount,
  trackCount,
  setSearch,
  sort,
  setSort,
  onNewTag,
}: {
  tagCount: number
  categoryCount: number
  trackCount: number
  setSearch: (s: string) => void
  sort: TagSort
  setSort: (s: TagSort) => void
  onNewTag: () => void
}) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearch(value.trim()), 150)
    return () => clearTimeout(t)
  }, [value, setSearch])

  return (
    <div className="h-[52px] shrink-0 bg-white border-b border-gray-200 shadow-sm flex items-center gap-3 px-4 z-10">
      <p className="text-xs text-gray-400 shrink-0">
        <span className="font-semibold text-gray-600">{tagCount}</span> {tagCount === 1 ? 'tag' : 'tags'}
        <span className="mx-1.5">·</span>
        <span className="font-semibold text-gray-600">{categoryCount}</span> {categoryCount === 1 ? 'category' : 'categories'}
        <span className="mx-1.5">·</span>
        <span className="font-semibold text-gray-600">{trackCount}</span> {trackCount === 1 ? 'track' : 'tracks'} tagged
      </p>
      <div className="flex-1" />
      <div className="relative w-44 md:w-60 shrink-0">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Search tags"
          className="w-full px-3 py-1.5 pr-7 rounded-full bg-gray-200 border border-gray-200 shadow-inner text-sm outline-none text-black placeholder:text-gray-400"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <SortMenu sort={sort} setSort={setSort}/>
      <button
        onClick={onNewTag}
        className="flex items-center gap-1 h-8 px-3.5 rounded-full bg-gray-100 border border-gray-300 shadow-md text-sm font-semibold text-black transition-all hover:bg-gray-200 active:shadow-inner active:scale-[0.99] shrink-0"
      >
        <span className="text-base leading-none">+</span> New tag
      </button>
    </div>
  )
}
