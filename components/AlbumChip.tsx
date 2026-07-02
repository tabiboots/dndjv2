import type { Album } from '@/types/spotify'

export default function AlbumChip({ album, onClick }: { album: Album; onClick?: (album: Album) => void }) {
  const art = album.images[0]?.url
  return (
    <button
      onClick={() => onClick?.(album)}
      className="flex flex-col items-start gap-1 shrink-0 w-40 text-left"
    >
      <div className="w-40 h-40 rounded-lg bg-gray-200 border border-gray-300 shadow-md overflow-hidden">
        {art && <img src={art} alt="" className="w-full h-full object-cover" />}
      </div>
      <p className="text-xs font-medium text-black truncate w-full">{album.name}</p>
      <p className="text-xs text-gray-400 truncate w-full">{album.artists.map(a => a.name).join(', ')}</p>
    </button>
  )
}
