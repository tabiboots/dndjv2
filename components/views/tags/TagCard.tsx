'use client'

import { tagColor } from '@/components/ui/TagChip'
import type { Tag } from '@/lib/contexts/TagDataContext'

export default function TagCard({
  tag,
  count,
  albumArts = [],
  isSelected = false,
  onSelect,
  variant = 'default',
}: {
  tag: Tag
  count: number
  albumArts?: string[]
  isSelected?: boolean
  onSelect?: () => void
  variant?: 'default' | 'compact'
}) {
  const color = tag.color ?? tagColor(tag.id)
  const countLabel = `${count} ${count === 1 ? 'track' : 'tracks'}`

  if (variant === 'compact') {
    return (
      <button
        onClick={onSelect}
        className={`flex flex-row items-center gap-1 p-4 rounded-2xl border text-left transition-all ${
          isSelected ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-md'
        }`}
      >
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px 2px ${color}66` }} />
        <p className="text-sm font-semibold text-black truncate">{tag.name}</p>
        <p className="text-xs text-gray-400">{countLabel}</p>
      </button>
    )
  }

  return (
    <button
      onClick={onSelect}
      className="block relative overflow-hidden rounded-xl border border-gray-300 bg-gray-100 text-left transition-all duration-150 h-36 w-full shadow-md hover:scale-[1.015] hover:shadow-lg"
      style={isSelected ? { boxShadow: `0 0 0 2px #f3f4f6, 0 0 0 4px ${color}` } : undefined}
    >
      {albumArts.length > 0 ? (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-80 saturate-40">
          {Array.from({ length: 4 }, (_, i) =>
            albumArts[i]
              ? <img key={i} src={albumArts[i]} alt="" className="w-full h-full object-cover" />
              : <div key={i} className="w-full h-full bg-gray-200/60" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: color, opacity: 0.3 }} />
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ background: color, opacity: 0.08, mixBlendMode: 'multiply' }} />
      <div className="absolute bottom-2 left-2 right-2 flex">
        <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-sm rounded-xl px-2 py-1 max-w-full">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px 2px ${color}66` }} />
          <p className="text-sm font-semibold text-black truncate">{tag.name}</p>
          <p className="text-xs text-gray-400 shrink-0">{countLabel}</p>
        </div>
      </div>
    </button>
  )
}

export function TagCardSkeleton() {
  return <div className="h-36 w-full rounded-2xl border border-gray-300 bg-gray-200 shadow-md animate-pulse" />
}
