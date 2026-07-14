'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Album, Playlist, Track } from '@/types/spotify'
import SongChip, { Dot, TagButton, SongChipSkeleton } from '@/components/ui/SongChip'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import { useTrackTagsMap } from '@/lib/contexts/TagDataContext'

type MediaItem = Album | Playlist

function isAlbum(item: MediaItem): item is Album {
  return 'artists' in item
}

export default function MediaDrilldown({ item, onBack, onTag, onTagAll }: {
  item: MediaItem
  onBack: () => void
  onTag: (track: Track) => void
  onTagAll: (tracks: Track[]) => void
}) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextOffsetRef = useRef(0)
  const fetchingRef = useRef(false)
  const sentinelRef = useRef<HTMLLIElement>(null)
  const { playingUri, playTrack, pauseTrack } = usePlayback()

  const fetchPage = async (offset: number) => {
    const base = isAlbum(item)
      ? `/api/spotify/albums/${item.id}/tracks`
      : `/api/spotify/playlists/${item.id}/items`

    const { data, error: e } = await fetch(`${base}?offset=${offset}`).then(r => r.json())
    if (e) throw new Error(e)
    const raw: Track[] = isAlbum(item)
      ? (data?.items ?? []).map((t: Omit<Track, 'album'>) => ({ ...t, album: { images: item.images } }))
      : (data?.items ?? []).map((i: { item: Track }) => i.item).filter(Boolean)
    // offset by raw page size, not tracks.length: playlist pages can contain null items
    return { raw, pageLen: data?.items?.length ?? 0, next: data?.next != null, total: data?.total ?? null }
  }

  const loadPage = (offset: number) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    fetchPage(offset)
      .then(({ raw, pageLen, next, total: t }) => {
        nextOffsetRef.current = offset + pageLen
        setHasMore(next)
        if (t != null) setTotal(t)
        setTracks(prev => offset === 0 ? raw : [...prev, ...raw])
      })
      .catch(err => setError(err.message || 'Failed to load tracks'))
      .finally(() => {
        fetchingRef.current = false
        setLoading(false)
      })
  }

  const tagAll = async () => {
    if (fetchingRef.current || loadingAll) return
    setLoadingAll(true)
    fetchingRef.current = true // block the intersection-observer loader while we drain pages
    try {
      let all = tracks
      let more = hasMore
      while (more) {
        const { raw, pageLen, next } = await fetchPage(nextOffsetRef.current)
        if (pageLen === 0) break
        nextOffsetRef.current += pageLen
        all = [...all, ...raw]
        more = next
      }
      setTracks(all)
      setHasMore(false)
      onTagAll(all)
    } catch {
      setError('Failed to load all tracks')
    } finally {
      fetchingRef.current = false
      setLoadingAll(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    setTracks([])
    setTotal(null)
    setHasMore(false)
    nextOffsetRef.current = 0
    loadPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadPage(nextOffsetRef.current)
    })
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, tracks.length])

  const art = item.images?.[0]?.url
  const subtitle = isAlbum(item) ? item.artists.map(a => a.name).join(', ') : null
  const songCount = total ?? (isAlbum(item) ? item.total_tracks : tracks.length)

  const trackTagsMap = useTrackTagsMap()
  // counts reflect loaded tracks only (fills in as pages arrive); derived from context so they update live
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of tracks) for (const id of trackTagsMap[t.id ?? ''] ?? []) counts[id] = (counts[id] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [tracks, trackTagsMap])

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
          {!loading && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 pt-1 text-xs text-gray-400">
              <span>{songCount} song{songCount === 1 ? '' : 's'}</span>
              {tagCounts.length > 0 && <span>·</span>}
              {tagCounts.map(([id, n]) => (
                <span key={id} className="flex items-center gap-1 tabular-nums">
                  <Dot tagId={id} />{n}
                </span>
              ))}
            </div>
          )}
        </div>
        <TagButton
          onClick={tagAll}
          disabled={loading || loadingAll}
          className={`ml-auto mr-6 w-16 h-16 shrink-0 disabled:opacity-50 ${loadingAll ? 'animate-pulse' : ''}`}
        />
      </div>

      {error ? (
        <p className="text-xs text-red-400 px-3 py-3">{error}</p>
      ) : (
        <ul className="overflow-y-auto flex flex-col gap-2 px-3 py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SongChipSkeleton key={i} />)
            : tracks.map((track, i) => (
            <SongChip
              key={`${track.id}:${i}`}
              track={track}
              isActive={playingUri === track.uri}
              onClick={t => playTrack(t, tracks)}
              onPause={pauseTrack}
            >
              <TagButton onClick={() => onTag(track)} />
            </SongChip>
          ))}
          {!loading && hasMore && (
            <li ref={sentinelRef}>
              <SongChipSkeleton />
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
