'use client'

import { useEffect, useState } from 'react'
import Footer, { type DisplayTrack } from '@/components/footer/Footer'
import SearchView from '@/components/views/Search'
import TagsView from '@/components/views/Tags'
import DeployView from '@/components/views/Deploy'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import type { Track } from '@/types/spotify'
import { TagDataProvider } from '@/lib/contexts/TagDataContext'
import { PlaybackProvider } from '@/lib/contexts/PlaybackContext'
import { QueryProvider } from '@/lib/QueryProvider'

const VIEWS = ['Search', 'Tags', 'Deploy'] as const
type View = typeof VIEWS[number]

export default function Home() {
  const { player, deviceId, isReady, playbackState, error } = useSpotifyPlayer()
  const [activeView, setActiveView] = useState<View>('Tags')
  const [fallbackTrack, setFallbackTrack] = useState<DisplayTrack | null>(null)
  const [quickTagTrack, setQuickTagTrack] = useState<Track | null>(null)

  const tagNowPlaying = () => {
    const t = playbackState?.track_window.current_track
    if (!t?.id) return
    setQuickTagTrack({
      id: t.id,
      name: t.name,
      artists: t.artists.map(a => ({ name: a.name })),
      album: { images: t.album.images.map(i => ({ url: i.url })) },
      duration_ms: t.duration_ms,
      uri: t.uri,
    })
    setActiveView('Search')
  }

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
    <div className="h-screen flex flex-col">
      <main className="flex-1 overflow-hidden flex flex-col">
        <QueryProvider>
        <TagDataProvider>
          <PlaybackProvider playbackState={playbackState}>
            <div className={activeView === 'Search' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}><SearchView visible={activeView === 'Search'} quickTagTrack={quickTagTrack} /></div>
            <div className={activeView === 'Tags' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}><TagsView onOpenSearch={() => setActiveView('Search')} /></div>
            <div className={activeView === 'Deploy' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}><DeployView /></div>
          </PlaybackProvider>
        </TagDataProvider>
        </QueryProvider>
      </main>
      <Footer
        player={player}
        playbackState={playbackState}
        isReady={isReady}
        fallbackTrack={fallbackTrack}
        error={error}
        views={VIEWS}
        active={activeView}
        onViewChange={(v) => setActiveView(v as View)}
        onTagNowPlaying={tagNowPlaying}
      />
    </div>
  )
}
