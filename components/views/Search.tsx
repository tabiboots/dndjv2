'use client'

import { useRef, useState } from 'react'
import SongChip, { type Track } from '@/components/SongChip'
import TagPanel from '@/components/TagPanel'

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [playingUri, setPlayingUri] = useState<string | null>(null)
  const [taggedTrack, setTaggedTrack] = useState<Track | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPage = async (q: string, off: number, replace: boolean) => {
    const res = await fetch(
      `/api/spotify/search?q=${encodeURIComponent(q)}&type=track&market=from_token&limit=10&offset=${off}`
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
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setTracks([]); setOffset(0); setHasMore(false); setError(null); setLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setLoading(true); setError(null); setTracks([]); setOffset(0); setHasMore(false)
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

      {loading && <p className="text-xs text-gray-400 px-3 py-2">Searching…</p>}
      {error && <p className="text-xs text-red-400 px-3 py-2">{error}</p>}

      {tracks.length > 0 && (
        <>
          <h2 className="px-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">Results</h2>
          <div className="flex-1 flex flex-row overflow-hidden">
            <ul
              onScroll={handleScroll}
              className="overflow-y-auto flex flex-col gap-2 px-3 pb-3 transition-all duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ width: taggedTrack ? '70%' : '100%' }}
            >
              {tracks.map(track => (
                <SongChip
                  key={track.id}
                  track={track}
                  isActive={playingUri === track.uri}
                  onClick={playTrack}
                  onPause={pauseTrack}
                  onTag={setTaggedTrack}
                />
              ))}
              {loadingMore && <li className="text-xs text-gray-400 text-center py-2">Loading more…</li>}
            </ul>

            <div
              className="overflow-hidden transition-all duration-300 border-l border-gray-200"
              style={{ width: taggedTrack ? '30%' : '0' }}
            >
              {taggedTrack && <TagPanel track={taggedTrack} onClose={() => setTaggedTrack(null)} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
