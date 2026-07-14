'use client'

import { useEffect, useRef, useState } from 'react'
import type { Track, Album, Playlist } from '@/types/spotify'
import SongChip, { TagButton, SongChipSkeleton } from '@/components/ui/SongChip'
import TrackTagger from '@/components/ui/TrackTagger'
import MediaChip, { MediaChipSkeleton } from '@/components/ui/MediaChip'
import MediaDrilldown from '@/components/ui/MediaDrilldown'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import { useSentinel } from '@/hooks/useSentinel'

export default function SearchView({ visible, quickTagTrack }: { visible?: boolean; quickTagTrack?: Track | null }) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [taggedTracks, setTaggedTracks] = useState<Track[] | null>(null)
  const [selected, setSelected] = useState<Album | Playlist | null>(null)
  const { playingUri, playTrack: ctxPlayTrack, pauseTrack } = usePlayback()

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // live query for staleness checks inside async callbacks (state closures go stale)
  const queryRef = useRef('')

  const [playlistsHasMore, setPlaylistsHasMore] = useState(false)
  const [albumsHasMore, setAlbumsHasMore] = useState(false)
  const playlistOffsetRef = useRef(0)
  const albumOffsetRef = useRef(0)
  const loadingPlaylistsRef = useRef(false)
  const loadingAlbumsRef = useRef(false)

  const loadPlaylists = async (offset: number) => {
    if (loadingPlaylistsRef.current) return
    loadingPlaylistsRef.current = true
    try {
      const acc: Playlist[] = []
      let off = offset
      let more = true
      // drain pages until something survives the server's owned-only filter,
      // so the sentinel never stalls on a page that filtered down to nothing
      while (more && acc.length === 0) {
        const { data } = await fetch(`/api/spotify/playlists?offset=${off}`).then(r => r.json())
        acc.push(...(data?.items ?? []))
        off = data?.nextOffset ?? off
        more = data?.next ?? false
      }
      playlistOffsetRef.current = off
      setPlaylistsHasMore(more)
      setPlaylists(prev => offset === 0 ? acc : [...prev, ...acc])
    } catch {
      // strip is decorative on the recents screen; fail quiet like loadRecent
    } finally {
      loadingPlaylistsRef.current = false
    }
  }

  const loadMoreAlbums = () => {
    if (loadingAlbumsRef.current) return
    loadingAlbumsRef.current = true
    fetch(`/api/spotify/search?q=${encodeURIComponent(query.trim())}&type=album&market=from_token&limit=10&offset=${albumOffsetRef.current}`)
      .then(r => r.json())
      .then(({ data }) => {
        const items: Album[] = data?.albums?.items ?? []
        albumOffsetRef.current += items.length
        setAlbumsHasMore(items.length > 0 && albumOffsetRef.current < (data?.albums?.total ?? 0))
        setAlbums(prev => {
          const seen = new Set(prev.map(a => a.id))
          return [...prev, ...items.filter(a => !seen.has(a.id))]
        })
      })
      .catch(() => {})
      .finally(() => { loadingAlbumsRef.current = false })
  }

  const loadRecent = () => {
    void loadPlaylists(0)
    fetch('/api/spotify/recently-played')
      .then(r => r.json())
      .then(recentData => {
        // stale response: user started searching while this was in flight
        if (queryRef.current.trim().length >= 2) return
        const seen = new Set<string | null>()
        const items: Track[] = (recentData.data?.items ?? [])
          .map((i: { track: Track }) => i.track)
          .filter((t: Track) => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
        setTracks(items)
      }).catch(() => {})
  }

  const playlistSentinelRef = useSentinel<HTMLDivElement>(
    playlistsHasMore, () => loadPlaylists(playlistOffsetRef.current), playlists.length)
  const albumSentinelRef = useSentinel<HTMLDivElement>(albumsHasMore, loadMoreAlbums, albums.length)

  useEffect(() => {
    if (visible && query.trim().length < 2) loadRecent()
  }, [visible])

  // footer quicktag: page.tsx builds a fresh object per click, so identity changes re-open the panel
  const [prevQuickTag, setPrevQuickTag] = useState(quickTagTrack)
  if (quickTagTrack !== prevQuickTag) {
    setPrevQuickTag(quickTagTrack)
    if (quickTagTrack) setTaggedTracks([quickTagTrack])
  }

  const fetchPage = async (q: string, off: number, replace: boolean, signal?: AbortSignal) => {
    const res = await fetch(
      `/api/spotify/search?q=${encodeURIComponent(q)}&type=track,album&market=from_token&limit=10&offset=${off}`,
      { signal }
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

    if (replace) {
      const albumItems: Album[] = data?.albums?.items ?? []
      setAlbums(albumItems)
      albumOffsetRef.current = albumItems.length
      setAlbumsHasMore(albumItems.length < (data?.albums?.total ?? 0))
    }
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
    queryRef.current = value
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
      setLoading(true); setError(null); setOffset(0); setHasMore(false)
      setAlbums([]); setAlbumsHasMore(false); setPlaylists([]); setPlaylistsHasMore(false)
      try {
        await fetchPage(trimmed, 0, true, abortRef.current.signal)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setError('Search failed')
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const playTrack = async (track: Track, queue?: Track[]) => {
    const res = await ctxPlayTrack(track, queue)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Playback failed' }))
      setError(error ?? 'Playback failed')
    }
  }

  const handleScroll = async (e: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingMore) return
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 100) return

    setLoadingMore(true)
    try {
      await fetchPage(query.trim(), offset, false, abortRef.current?.signal)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setError('Search failed')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 relative">
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Search"
          className="w-full px-3 py-2 rounded-full bg-gray-200 border border-gray-200 shadow-inner text-sm outline-none placeholder:text-gray-400"
          autoFocus
        />
        {query && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400 px-3 py-2">{error}</p>}

      {(selected || loading || tracks.length > 0 || taggedTracks) && (
        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden" style={{ width: taggedTracks ? '70%' : '100%' }}>
            {selected ? (
              <MediaDrilldown item={selected} onBack={() => setSelected(null)} onTag={t => setTaggedTracks([t])} onTagAll={setTaggedTracks} />
            ) : (
              <>
                {query.trim().length >= 2 && (loading || albums.length > 0) && (
                  <div className="flex gap-3 overflow-x-auto px-3 pt-1 pb-3 shrink-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => <MediaChipSkeleton key={i} />)
                      : albums.map(a => <MediaChip key={a.id} name={a.name} imageUrl={a.images?.[0]?.url} subtitle={a.artists.map(x => x.name).join(', ')} onClick={() => setSelected(a)} />)
                    }
                    {!loading && albumsHasMore && <div ref={albumSentinelRef}><MediaChipSkeleton /></div>}
                  </div>
                )}
                {!loading && query.trim().length < 2 && playlists.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto px-3 pt-1 pb-3 shrink-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {playlists.map(p => <MediaChip key={p.id} name={p.name} imageUrl={p.images?.[0]?.url} onClick={() => setSelected(p)} />)}
                    {playlistsHasMore && <div ref={playlistSentinelRef}><MediaChipSkeleton /></div>}
                  </div>
                )}
                <ul
                  onScroll={handleScroll}
                  className="overflow-y-auto flex flex-col gap-2 px-3 pb-3 transition-all duration-300 scrollbar-none mask-[linear-gradient(to_bottom,transparent,black_20px)]"
                >
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
                        <TagButton onClick={() => setTaggedTracks([track])} />
                      </SongChip>
                    ))
                  }
                  {loadingMore && <li className="text-xs text-gray-400 text-center py-2">Loading more…</li>}
                </ul>
              </>
            )}
          </div>

          <div
            className="overflow-hidden transition-all duration-300 border-l border-gray-200 bg-white shrink-0"
            style={{ width: taggedTracks ? 360 : 0 }}
          >
            {taggedTracks && (
              <TrackTagger
                tracks={taggedTracks}
                cover={selected?.images?.[0]?.url}
                onClose={() => setTaggedTracks(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
