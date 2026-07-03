'use client'

import { createContext, useContext, useState } from 'react'
import type { Track } from '@/types/spotify'

type PlaybackValue = {
  playingUri: string | null
  playTrack: (track: Track) => Promise<Response>
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

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [playingUri, setPlayingUri] = useState<string | null>(null)

  const playTrack = async (track: Track): Promise<Response> => {
    const res = await fetch('/api/spotify/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: track.uri }),
    })
    if (res.ok) setPlayingUri(track.uri)
    return res
  }

  const pauseTrack = async () => {
    await fetch('/api/spotify/player/pause', { method: 'PUT' })
    setPlayingUri(null)
  }

  return (
    <PlaybackContext.Provider value={{ playingUri, playTrack, pauseTrack }}>
      {children}
    </PlaybackContext.Provider>
  )
}
