'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Track } from '@/types/spotify'

// Spotify caps the uris array on the play endpoint
const MAX_URIS = 300

type PlaybackValue = {
  playingUri: string | null
  playTrack: (track: Track, queue?: Track[]) => Promise<Response>
  pauseTrack: () => Promise<void>
}

const PlaybackContext = createContext<PlaybackValue>({
  playingUri: null,
  playTrack: async () => new Response(),
  pauseTrack: async () => {},
})

export function usePlayback() {
  return useContext(PlaybackContext)
}

export function PlaybackProvider({
  playbackState,
  children,
}: {
  playbackState: Spotify.PlaybackState | null
  children: React.ReactNode
}) {
  // instant feedback on click; the next SDK event always wins
  const [optimisticUri, setOptimisticUri] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticUri(null)
  }, [playbackState])

  const playingUri =
    optimisticUri ??
    (playbackState && !playbackState.paused
      ? playbackState.track_window.current_track?.uri ?? null
      : null)

  const playTrack = async (track: Track, queue?: Track[]): Promise<Response> => {
    const idx = queue?.findIndex(t => t.uri === track.uri) ?? -1
    let body: { uris: string[]; offset?: number }
    if (queue && idx !== -1) {
      const start = Math.max(0, Math.min(idx, queue.length - MAX_URIS))
      const window = queue.slice(start, start + MAX_URIS)
      body = { uris: window.map(t => t.uri), offset: idx - start }
    } else {
      body = { uris: [track.uri] }
    }

    const res = await fetch('/api/spotify/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) setOptimisticUri(track.uri)
    return res
  }

  const pauseTrack = async () => {
    setOptimisticUri(null)
    await fetch('/api/spotify/player/pause', { method: 'PUT' })
  }

  return (
    <PlaybackContext.Provider value={{ playingUri, playTrack, pauseTrack }}>
      {children}
    </PlaybackContext.Provider>
  )
}
