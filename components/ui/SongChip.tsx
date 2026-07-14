import type { ReactNode } from 'react'
import type { Track } from '@/types/spotify'
import IconButton from '@/components/ui/IconButton'
import { tagColor } from '@/components/ui/TagChip'
import { useTag, useTrackTagIds } from '@/lib/contexts/TagDataContext'

export function Dot({ tagId }: { tagId: string }) {
  const tag = useTag(tagId)
  const color = tag?.color ?? tagColor(tagId)
  return <span title={tag?.name} className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
}

function msToMinSec(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function SongChip({
  track,
  isActive,
  onClick,
  onPause,
  children,
}: {
  track: Track
  isActive?: boolean
  onClick?: (track: Track) => void
  onPause?: () => void
  children?: ReactNode
}) {
  const thumb = track.album.images.at(-1)?.url
  const tagIds = useTrackTagIds(track.id)

  return (
    <li className={`relative flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${isActive ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-md'}`}>
      {/* after: pseudo stretches the hitbox/hover area over the left third of the chip; visuals stay on the art */}
      <button
        onClick={isActive ? onPause : () => onClick?.(track)}
        className="group w-9 h-9 shrink-0 rounded bg-gray-200 border border-gray-200 shadow-inner after:absolute after:inset-y-0 after:left-0 after:w-2/3"
      >
        <span className="relative block w-full h-full rounded overflow-hidden">
        {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          {isActive ? (
            <svg
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white"
              width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <line x1="8" y1="5" x2="8" y2="19" />
              <line x1="16" y1="5" x2="16" y2="19" />
            </svg>
          ) : (
            <svg
              className="opacity-0 group-hover:opacity-100 transition-opacity text-white translate-x-px"
              width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </div>
        </span>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      {tagIds.length > 0 && (
        <div className="flex gap-1 items-center shrink-0">
          {tagIds.map(id => <Dot key={id} tagId={id} />)}
        </div>
      )}
      <span className="text-xs text-gray-400 shrink-0 tabular-nums">{msToMinSec(track.duration_ms)}</span>
      {children}
    </li>
  )
}

export function SongChipSkeleton() {
  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-gray-100 border-gray-300 shadow-md animate-pulse">
      <div className="w-9 h-9 shrink-0 rounded bg-gray-200 border border-gray-200" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-3 w-2/3 rounded bg-gray-100" />
        <div className="h-2.5 w-1/3 rounded bg-gray-100" />
      </div>
      <div className="h-2.5 w-7 rounded bg-gray-100 shrink-0" />
      <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
    </li>
  )
}

export function TagButton({ onClick,
                              className = 'w-9 h-9', disabled, multi }: { onClick: () => void; className?: string; disabled?: boolean; multi?: boolean }) {
  return (
    <IconButton onClick={onClick} className={className} disabled={disabled}>
      <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {multi ? (
          <path d="M21 11L13.4059 3.40589C12.887 2.88703 12.6276 2.6276 12.3249 2.44208C12.0564 2.27759 11.7638 2.15638 11.4577 2.08289C11.1124 2 10.7455 2 10.0118 2L6 2M3 8.7L3 10.6745C3 11.1637 3 11.4083 3.05526 11.6385C3.10425 11.8425 3.18506 12.0376 3.29472 12.2166C3.4184 12.4184 3.59136 12.5914 3.93726 12.9373L11.7373 20.7373C12.5293 21.5293 12.9253 21.9253 13.382 22.0737C13.7837 22.2042 14.2163 22.2042 14.618 22.0737C15.0747 21.9253 15.4707 21.5293 16.2627 20.7373L18.7373 18.2627C19.5293 17.4707 19.9253 17.0747 20.0737 16.618C20.2042 16.2163 20.2042 15.7837 20.0737 15.382C19.9253 14.9253 19.5293 14.5293 18.7373 13.7373L11.4373 6.43726C11.0914 6.09136 10.9184 5.9184 10.7166 5.79472C10.5376 5.68506 10.3425 5.60425 10.1385 5.55526C9.90829 5.5 9.6637 5.5 9.17452 5.5H6.2C5.0799 5.5 4.51984 5.5 4.09202 5.71799C3.7157 5.90973 3.40973 6.21569 3.21799 6.59202C3 7.01984 3 7.57989 3 8.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        ) : (
          <path d="M8 8H8.01M2 5.2L2 9.67451C2 10.1637 2 10.4083 2.05526 10.6385C2.10425 10.8425 2.18506 11.0376 2.29472 11.2166C2.4184 11.4184 2.59135 11.5914 2.93726 11.9373L10.6059 19.6059C11.7939 20.7939 12.388 21.388 13.0729 21.6105C13.6755 21.8063 14.3245 21.8063 14.927 21.6105C15.612 21.388 16.2061 20.7939 17.3941 19.6059L19.6059 17.3941C20.7939 16.2061 21.388 15.612 21.6105 14.927C21.8063 14.3245 21.8063 13.6755 21.6105 13.0729C21.388 12.388 20.7939 11.7939 19.6059 10.6059L11.9373 2.93726C11.5914 2.59135 11.4184 2.4184 11.2166 2.29472C11.0376 2.18506 10.8425 2.10425 10.6385 2.05526C10.4083 2 10.1637 2 9.67452 2L5.2 2C4.0799 2 3.51984 2 3.09202 2.21799C2.7157 2.40973 2.40973 2.71569 2.21799 3.09202C2 3.51984 2 4.07989 2 5.2ZM8.5 8C8.5 8.27614 8.27614 8.5 8 8.5C7.72386 8.5 7.5 8.27614 7.5 8C7.5 7.72386 7.72386 7.5 8 7.5C8.27614 7.5 8.5 7.72386 8.5 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        )}
      </svg>
    </IconButton>
  )
}
