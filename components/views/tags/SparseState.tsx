'use client'

import { tripletToHsl } from '@/lib/tagColors'
import type { TagPreset } from '@/components/views/tags/EmptyState'

const SUGGESTIONS: TagPreset[] = [
  { name: 'Combat', hue: 0 },
  { name: 'Tavern', hue: 35 },
  { name: 'Exploration', hue: 120 },
  { name: 'Dungeon', hue: 270 },
  { name: 'Boss fight', hue: 320 },
  { name: 'Long rest', hue: 210 },
]

const TIPS = [
  {lead: "1.", text: 'Click a tag to rename, recolor, or categorize it' },
  {lead: "2.", text:  "Tag songs from Search — open a track's tag panel" },
  {lead: "3.", text: 'When the scene shifts, Deploy the matching tags as a queue' },
]

export default function SparseState({
  existingNames,
  onSuggest,
}: {
  existingNames: string[]
  onSuggest: (preset: TagPreset) => void
}) {
  const taken = new Set(existingNames.map(n => n.toLowerCase()))
  const suggestions = SUGGESTIONS.filter(s => !taken.has(s.name.toLowerCase()))

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tips</p>
        <div className="grid grid-cols-3 gap-3">
          {TIPS.map(tip => (
            <div key={tip.lead} className="flex items-start gap-2 p-3 rounded-2xl bg-gray-100 border border-gray-300 shadow-md">
              <span className="text-base leading-none">{tip.lead}</span>
              <p className="text-xs text-gray-500">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Suggested next tags</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(preset => (
              <button
                key={preset.name}
                onClick={() => onSuggest(preset)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: tripletToHsl(preset.hue, 65, 55) }} />
                + {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
