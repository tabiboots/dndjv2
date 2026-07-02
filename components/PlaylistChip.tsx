import type { Playlist } from '@/types/spotify'

export default function PlaylistChip({ playlist, onClick }: { playlist: Playlist; onClick?: (playlist: Playlist) => void }) {
  const art = playlist.images[0]?.url
  return (
    <button
      onClick={() => onClick?.(playlist)}
      className="flex flex-col items-start gap-1 shrink-0 w-40 text-left"
    >
      <div className="w-40 h-40 rounded-lg bg-gray-200 border border-gray-300 shadow-md overflow-hidden">
        {art && <img src={art} alt="" className="w-full h-full object-cover" />}
      </div>
      <p className="text-xs font-medium text-black truncate w-full">{playlist.name}</p>
    </button>
  )
}
