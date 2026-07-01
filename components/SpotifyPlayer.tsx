'use client'

import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'

export function SpotifyPlayer() {
  const { player, deviceId, isReady, playbackState } = useSpotifyPlayer()

  const track = playbackState?.track_window.current_track
  const isPaused = playbackState?.paused ?? true

  if (!isReady) {
    return (
      <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
        <p>{deviceId ? 'Connecting…' : 'Loading player…'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {track ? (
        <>
          {track.album.images[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.album.name}
              width={200}
              height={200}
              className="rounded-lg shadow-lg"
            />
          )}
          <div className="text-center">
            <p className="font-semibold text-lg">{track.name}</p>
            <p className="text-sm text-gray-400">
              {track.artists.map((a) => a.name).join(', ')}
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">No track playing</p>
      )}

      <div className="flex items-center gap-6">
        <button
          onClick={() => player?.previousTrack()}
          className="text-2xl hover:text-white text-gray-300 transition-colors"
          aria-label="Previous"
        >
          ⏮
        </button>
        <button
          onClick={() => player?.togglePlay()}
          className="text-4xl hover:text-white text-gray-300 transition-colors"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={() => player?.nextTrack()}
          className="text-2xl hover:text-white text-gray-300 transition-colors"
          aria-label="Next"
        >
          ⏭
        </button>
      </div>
    </div>
  )
}
