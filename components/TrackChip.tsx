import type { DisplayTrack } from './Footer'

interface Props {
  track: DisplayTrack | null
  isReady: boolean
  error?: string | null
}

export default function TrackChip({ track, isReady, error }: Props) {
  const albumArt = track?.album.images[0]?.url

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 shrink-0 bg-gray-100 rounded overflow-hidden">
        {albumArt && <img src={albumArt} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0">
        {track ? (
          <>
            <p className="text-sm font-medium text-black truncate">{track.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {track.artists.map(a => a.name).join(', ')}
            </p>
          </>
        ) : (
          <p className={`text-sm truncate ${error ? 'text-red-400' : 'text-gray-300'}`}>
            {error ?? (isReady ? 'Nothing playing' : 'Connecting…')}
          </p>
        )}
      </div>
    </div>
  )
}
