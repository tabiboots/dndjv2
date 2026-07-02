'use client'

import { useEffect, useRef, useState } from 'react'
import type { Track, Album, Playlist } from '@/types/spotify'
import SongChip, { TagButton, SongChipSkeleton } from '@/components/SongChip'
import TagPanel from '@/components/TagPanel'
import MediaChip, { MediaChipSkeleton } from '@/components/ui/MediaChip'
import MediaDrilldown from '@/components/ui/MediaDrilldown'

export default function SearchView({ visible }: { visible?: boolean }) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [playingUri, setPlayingUri] = useState<string | null>(null)
  const [taggedTrack, setTaggedTrack] = useState<Track | null>(null)
  const [selected, setSelected] = useState<Album | Playlist | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadRecent = () => {
    Promise.all([
      fetch('/api/spotify/recently-played').then(r => r.json()),
      fetch('/api/spotify/playlists').then(r => r.json()),
    ]).then(([recentData, playlistData]) => {
      const seen = new Set<string | null>()
      const items: Track[] = (recentData.data?.items ?? [])
        .map((i: { track: Track }) => i.track)
        .filter((t: Track) => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
      setTracks(items)
      setPlaylists(playlistData.data?.items ?? [])
    }).catch(() => {})
  }

  useEffect(() => {
    if (visible && query.trim().length < 2) loadRecent()
  }, [visible])

  const fetchPage = async (q: string, off: number, replace: boolean) => {
    const res = await fetch(
      `/api/spotify/search?q=${encodeURIComponent(q)}&type=track,album&market=from_token&limit=10&offset=${off}`
    )
    const { data, error: apiError, code } = await res.json()

    if (code === 'rate_limited') {
      setError('Rate limited — wait a moment and try again')
      return
    }
    if (apiError) { setError(apiError); return }

    const items: Track[] = data?.tracks?.items ?? []
    const total: number = data?.tracks?.total ?? 0
    const newOffset = off + items.length

    if (replace) setAlbums(data?.albums?.items ?? [])
    setTracks(prev => {
      if (replace) return items
      const seen = new Set(prev.map(t => t.id))
      return [...prev, ...items.filter(t => !seen.has(t.id))]
    })
    setOffset(newOffset)
    setHasMore(newOffset < total)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setOffset(0); setHasMore(false); setError(null); setLoading(false)
      loadRecent()
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setLoading(true); setError(null); setOffset(0); setHasMore(false); setAlbums([]); setPlaylists([])
      try {
        await fetchPage(trimmed, 0, true)
      } catch {
        setError('Search failed')
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const playTrack = async (track: Track) => {
    const res = await fetch('/api/spotify/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: track.uri }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Playback failed' }))
      setError(error ?? 'Playback failed')
    } else {
      setPlayingUri(track.uri)
    }
  }

  const pauseTrack = async () => {
    await fetch('/api/spotify/player/pause', { method: 'PUT' })
    setPlayingUri(null)
  }

  const handleScroll = async (e: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingMore) return
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 100) return

    setLoadingMore(true)
    try {
      await fetchPage(query.trim(), offset, false)
    } catch {
      setError('Search failed')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3">
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Search"
          className="w-full px-3 py-2 rounded-full bg-gray-200 border border-gray-200 shadow-inner text-sm outline-none placeholder:text-gray-400"
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-red-400 px-3 py-2">{error}</p>}

      {(selected || loading || tracks.length > 0 || taggedTrack) && (
        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden" style={{ width: taggedTrack ? '70%' : '100%' }}>
            {selected ? (
              <MediaDrilldown item={selected} onBack={() => setSelected(null)} onTag={setTaggedTrack} />
            ) : (
              <>
                {query.trim().length >= 2 && (loading || albums.length > 0) && (
                  <div className="flex gap-3 overflow-x-auto px-3 pt-1 pb-3 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => <MediaChipSkeleton key={i} />)
                      : albums.map(a => <MediaChip key={a.id} name={a.name} imageUrl={a.images[0]?.url} subtitle={a.artists.map(x => x.name).join(', ')} onClick={() => setSelected(a)} />)
                    }
                  </div>
                )}
                {!loading && query.trim().length < 2 && playlists.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto px-3 pt-1 pb-3 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {playlists.map(p => <MediaChip key={p.id} name={p.name} imageUrl={p.images[0]?.url} onClick={() => setSelected(p)} />)}
                  </div>
                )}
                <ul
                  onScroll={handleScroll}
                  className="overflow-y-auto flex flex-col gap-2 px-3 pb-3 transition-all duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SongChipSkeleton key={i} />)
                    : tracks.map(track => (
                      <SongChip
                        key={track.id}
                        track={track}
                        isActive={playingUri === track.uri}
                        onClick={playTrack}
                        onPause={pauseTrack}
                      >
                        <TagButton onClick={() => setTaggedTrack(track)} />
                      </SongChip>
                    ))
                  }
                  {loadingMore && <li className="text-xs text-gray-400 text-center py-2">Loading more…</li>}
                </ul>
              </>
            )}
          </div>

          <div
            className="overflow-hidden transition-all duration-300 border-l border-gray-200 ml-auto"
            style={{ width: taggedTrack ? '30%' : '0' }}
          >
            {taggedTrack && <TagPanel track={taggedTrack} onClose={() => setTaggedTrack(null)} />}
          </div>
        </div>
      )}
    </div>
  )
}
