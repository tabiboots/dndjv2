'use client'

import { useEffect, useState } from 'react'
import type { Album, Playlist, Track } from '@/types/spotify'
import SongChip, { TagButton } from '@/components/SongChip'

type MediaItem = Album | Playlist

function isAlbum(item: MediaItem): item is Album {
  return 'artists' in item
}

export default function MediaDrilldown({ item, onBack, onTag }: {
  item: MediaItem
  onBack: () => void
  onTag: (track: Track) => void
}) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingUri, setPlayingUri] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTracks([])

    const url = isAlbum(item)
      ? `/api/spotify/albums/${item.id}/tracks`
      : `/api/spotify/playlists/${item.id}/items`

    fetch(url)
      .then(r => r.json())
      .then(({ data, error: e }) => {
        if (e) { setError(e); return }
        const raw: Track[] = isAlbum(item)
          ? (data?.items ?? []).map((t: Omit<Track, 'album'>) => ({ ...t, album: { images: item.images } }))
          : (data?.items ?? []).map((i: { item: Track }) => i.item).filter(Boolean)
        setTracks(raw)
      })
      .catch(() => setError('Failed to load tracks'))
      .finally(() => setLoading(false))
  }, [item.id])

  const playTrack = async (track: Track) => {
    const res = await fetch('/api/spotify/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: track.uri }),
    })
    if (res.ok) setPlayingUri(track.uri)
  }

  const pauseTrack = async () => {
    await fetch('/api/spotify/player/pause', { method: 'PUT' })
    setPlayingUri(null)
  }

  const art = item.images[0]?.url
  const subtitle = isAlbum(item) ? item.artists.map(a => a.name).join(', ') : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-3 shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-black transition-colors shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        {art && <img src={art} alt="" className="w-12 h-12 rounded-lg object-cover shadow-md shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-black truncate">{item.name}</p>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400 px-3 py-3">{error}</p>
      ) : (
        <ul className="overflow-y-auto flex flex-col gap-2 px-3 py-3 scrollbar-none">
          {tracks.map(track => (
            <SongChip
              key={track.id}
              track={track}
              isActive={playingUri === track.uri}
              onClick={playTrack}
              onPause={pauseTrack}
            >
              <TagButton onClick={() => onTag(track)} />
            </SongChip>
          ))}
        </ul>
      )}
    </div>
  )
}
