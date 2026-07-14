'use client'

import { useEffect, useState } from 'react'
import type { Album, Playlist, Track } from '@/types/spotify'
import SongChip, { TagButton, SongChipSkeleton } from '@/components/ui/SongChip'
import { usePlayback } from '@/lib/contexts/PlaybackContext'

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
  const { playingUri, playTrack, pauseTrack } = usePlayback()

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

  const art = item.images?.[0]?.url
  const subtitle = isAlbum(item) ? item.artists.map(a => a.name).join(', ') : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-3 shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-black transition-colors shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        {art && <img src={art} alt="" className="w-48 h-48 rounded-lg object-cover shadow-md shrink-0" />}
        <div className="min-w-0 pl-3">
          <p className="text-2xl font-bold text-black truncate">{item.name}</p>
          {subtitle && <p className="text-medium text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>

      {error ? (
        <p className="text-xs text-red-400 px-3 py-3">{error}</p>
      ) : (
        <ul className="overflow-y-auto flex flex-col gap-2 px-3 py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SongChipSkeleton key={i} />)
            : tracks.map(track => (
            <SongChip
              key={track.id}
              track={track}
              isActive={playingUri === track.uri}
              onClick={t => playTrack(t, tracks)}
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
