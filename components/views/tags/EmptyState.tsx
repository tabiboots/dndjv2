'use client'

import { tripletToHsl } from '@/lib/tagColors'

export type TagPreset = { name: string; hue: number }

const PRESETS: TagPreset[] = [
  { name: 'Combat', hue: 0 },
  { name: 'Tavern', hue: 35 },
  { name: 'Exploration', hue: 120 },
  { name: 'Boss fight', hue: 320 },
]



export default function EmptyState({
  onCreate,
  onOpenSearch,
}: {
  onCreate: (preset?: TagPreset) => void
  onOpenSearch?: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 p-6 text-center">

      {/* breathing d20 */}
      <div
        style={{
          transform: 'rotate(-8deg)',
          filter: 'drop-shadow(0 24px 32px rgba(0,0,0,0.15))',
          animation: 'breath 5s ease-in-out infinite',
        }}
      >
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-black">Tags are how you score your game</p>
        <p className="text-sm text-gray-400 max-w-sm">Group songs by scene: combat, taverns, dungeons, anything your table needs.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => onCreate()}
          className="px-5 py-2.5 rounded-full bg-gray-100 border border-gray-300 shadow-md text-sm font-semibold text-black transition-all hover:bg-gray-200 active:shadow-inner active:scale-[0.99]"
        >
          + Create your first tag
        </button>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 rounded-full text-sm text-gray-500 hover:text-black border border-gray-300 bg-gray-100 transition-colors hover:bg-gray-200"
          >
            Open Search to tag a song
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-xs text-gray-400 mr-1">Or start with a preset:</span>
        {PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => onCreate(preset)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: tripletToHsl(preset.hue, 65, 55) }} />
            + {preset.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-500">1.</span> Create a tag
        <span className="mx-2">→</span>
        <span className="font-semibold text-gray-500">2.</span> Tag songs in Search
        <span className="mx-2">→</span>
        <span className="font-semibold text-gray-500">3.</span> Deploy the right scene to your queue
      </p>
    </div>
  )
}
