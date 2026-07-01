'use client'

import { useEffect, useState } from 'react'
import NowPlaying, { type DisplayTrack } from '@/components/NowPlaying'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'

const VIEWS = ['Search', 'Tags', 'Deploy'] as const

export default function Home() {
  const { player, deviceId, isReady, playbackState } = useSpotifyPlayer()
  const [activeView, setActiveView] = useState<string>(VIEWS[0])
  const [fallbackTrack, setFallbackTrack] = useState<DisplayTrack | null>(null)

  useEffect(() => {
    if (!isReady || !deviceId) return
    fetch('/api/spotify/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
  }, [isReady, deviceId])

  useEffect(() => {
    if (!isReady) return
    fetch('/api/spotify/recently-played')
      .then(r => r.json())
      .then(({ data }) => {
        const item = data?.items?.[0]?.track
        if (!item) return
        setFallbackTrack({
          name: item.name,
          artists: item.artists,
          album: { images: item.album.images },
        })
      })
      .catch(() => {})
  }, [isReady])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-400">{activeView}</p>
      </main>
      <NowPlaying
        player={player}
        playbackState={playbackState}
        isReady={isReady}
        fallbackTrack={fallbackTrack}
        views={VIEWS}
        active={activeView}
        onViewChange={setActiveView}
      />
    </div>
  )
}
