import IconButton from './IconButton'

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  duration_ms: number
  uri: string
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
  onTag,
}: {
  track: Track
  isActive?: boolean
  onClick?: (track: Track) => void
  onPause?: () => void
  onTag?: (track: Track) => void
}) {
  const thumb = track.album.images.at(-1)?.url

  return (
    <li className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all ${isActive ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-md'}`}>
      <button
        onClick={isActive ? onPause : () => onClick?.(track)}
        className="group relative w-9 h-9 shrink-0 rounded bg-gray-200 border border-gray-200 shadow-inner overflow-hidden"
      >
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
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0 tabular-nums">{msToMinSec(track.duration_ms)}</span>
      <IconButton onClick={() => onTag?.(track)} className="w-9 h-9">
        <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 8H8.01M2 5.2L2 9.67451C2 10.1637 2 10.4083 2.05526 10.6385C2.10425 10.8425 2.18506 11.0376 2.29472 11.2166C2.4184 11.4184 2.59135 11.5914 2.93726 11.9373L10.6059 19.6059C11.7939 20.7939 12.388 21.388 13.0729 21.6105C13.6755 21.8063 14.3245 21.8063 14.927 21.6105C15.612 21.388 16.2061 20.7939 17.3941 19.6059L19.6059 17.3941C20.7939 16.2061 21.388 15.612 21.6105 14.927C21.8063 14.3245 21.8063 13.6755 21.6105 13.0729C21.388 12.388 20.7939 11.7939 19.6059 10.6059L11.9373 2.93726C11.5914 2.59135 11.4184 2.4184 11.2166 2.29472C11.0376 2.18506 10.8425 2.10425 10.6385 2.05526C10.4083 2 10.1637 2 9.67452 2L5.2 2C4.0799 2 3.51984 2 3.09202 2.21799C2.7157 2.40973 2.40973 2.71569 2.21799 3.09202C2 3.51984 2 4.07989 2 5.2ZM8.5 8C8.5 8.27614 8.27614 8.5 8 8.5C7.72386 8.5 7.5 8.27614 7.5 8C7.5 7.72386 7.72386 7.5 8 7.5C8.27614 7.5 8.5 7.72386 8.5 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </IconButton>
    </li>
  )
}

export type { Track }
