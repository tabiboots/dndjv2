'use client'

import { useState } from 'react'

export type TagSort = 'category' | 'alpha' | 'tracks' | 'recent'

const OPTIONS: { value: TagSort; label: string }[] = [
  { value: 'category', label: 'By category' },
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'tracks', label: 'Most tracks' },
  { value: 'recent', label: 'Recently tagged' },
]

export default function SortMenu({ sort, setSort }: { sort: TagSort; setSort: (s: TagSort) => void }) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === sort)!

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-gray-100 border border-gray-300 shadow-md text-xs text-gray-600 hover:text-black transition-all active:shadow-inner"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        {current.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-2xl shadow-xl border border-gray-200 p-1 w-40 flex flex-col"
            style={{ animation: 'pop 0.12s ease forwards' }}
          >
            {OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { setSort(o.value); setOpen(false) }}
                className={`text-left text-xs px-3 py-2 rounded-xl transition-colors ${
                  o.value === sort ? 'bg-gray-200 text-black shadow-inner' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
