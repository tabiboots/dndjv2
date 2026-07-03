'use client'

import { tripletToHsl } from '@/lib/tagColors'

export const SAT_LIT_PRESETS = [{ s: 70, l: 32 }, { s: 65, l: 55 }, { s: 55, l: 78 }]

const HUE_GRADIENT = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => tripletToHsl(i * 30, 65, 55)).join(', ')})`

export default function ColorPicker({
  hue,
  sat,
  lit,
  onPreview,
  onCommit,
}: {
  hue: number
  sat: number
  lit: number
  onPreview: (h: number, s: number, l: number) => void
  onCommit: (h: number, s: number, l: number) => void
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative h-4 rounded-full flex-1" style={{ background: HUE_GRADIENT }}>
        <input
          type="range" min="0" max="360"
          value={hue}
          onChange={e => onPreview(Number(e.target.value), sat, lit)}
          onPointerUp={() => onCommit(hue, sat, lit)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `${hue / 360 * 100}%`, transform: 'translate(-50%, -50%)', background: tripletToHsl(hue, sat, lit) }}
        />
      </div>
      {SAT_LIT_PRESETS.map(({ s, l }) => {
        const c = tripletToHsl(hue, s, l)
        const isActive = sat === s && lit === l
        return (
          <button
            type="button"
            key={s}
            onClick={() => onCommit(hue, s, l)}
            className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-125"
            style={{
              background: c,
              border: '1px solid #d1d5db',
              boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
