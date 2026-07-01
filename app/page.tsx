'use client'

import { useEffect, useState } from 'react'
import Footer, { type DisplayTrack } from '@/components/Footer'
import SearchView from '@/components/views/Search'
import TagsView from '@/components/views/Tags'
import DeployView from '@/components/views/Deploy'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'

const VIEWS = ['Search', 'Tags', 'Deploy'] as const
type View = typeof VIEWS[number]

export default function Home() {
  const { player, deviceId, isReady, playbackState } = useSpotifyPlayer()
  const [activeView, setActiveView] = useState<View>('Search')
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
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'Search' && <SearchView />}
        {activeView === 'Tags' && <TagsView />}
        {activeView === 'Deploy' && <DeployView />}
      </main>
      <Footer
        player={player}
        playbackState={playbackState}
        isReady={isReady}
        fallbackTrack={fallbackTrack}
        views={VIEWS}
        active={activeView}
        onViewChange={(v) => setActiveView(v as View)}
      />
    </div>
  )
}
