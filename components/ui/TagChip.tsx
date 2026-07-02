'use client'

import { useTagColor } from '@/lib/contexts/TagDataContext'

// ponytail: stable per-id fallback for tags that have no stored color yet
export function tagColor(id: string): string {
  const hue = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 65%, 55%)`
}

export default function TagChip({ id, name, active }: { id: string; name: string; active?: boolean }) {
  const color = useTagColor(id) ?? tagColor(id)
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 pr-3 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-xl leading-none text-gray-700 whitespace-nowrap">
      <span
        className="w-2 h-2 mr-1 rounded-full shrink-0 transition-all duration-100 ease-in"
        style={active ? { background: color, boxShadow: `0 0 5px 2px ${color}88` } : { background: '#d1d5db' }}
      />
      {name.toLowerCase()}
    </span>
  )
}
