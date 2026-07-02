'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SongChip, { SongChipSkeleton } from '@/components/ui/SongChip'
import { tagColor } from '@/components/ui/TagChip'
import type { Track } from '@/types/spotify'

type Tag = { id: string; name: string; count: number }
type DBTrack = {
  spotify_id: string
  name: string
  artist_names: string[]
  album_art_url: string | null
  duration_ms: number
  uri: string
}

function dbToTrack(t: DBTrack): Track {
  return {
    id: t.spotify_id,
    name: t.name,
    artists: t.artist_names.map(name => ({ name })),
    album: { images: t.album_art_url ? [{ url: t.album_art_url }] : [] },
    duration_ms: t.duration_ms,
    uri: t.uri,
  }
}

const supabase = createClient()

export default function TagsView() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [selected, setSelected] = useState<Tag | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [playingUri, setPlayingUri] = useState<string | null>(null)
  const selectedRef = useRef<Tag | null>(null)

  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const fetchTags = async (uid: string) => {
    const { data } = await supabase
      .from('tags')
      .select('id, name, track_tags(spotify_id)')
      .eq('user_id', uid)
      .order('name')
    const rows = data ?? []
    setTags(rows.map(t => ({
      id: t.id,
      name: t.name,
      count: (t.track_tags as { spotify_id: string }[]).length,
    })))
    setLoadingTags(false)
    // deselect if the selected tag was deleted
    setSelected(prev => (prev && rows.some(r => r.id === prev.id) ? prev : null))
  }

  const fetchTracks = async (uid: string, tagId: string) => {
    const { data } = await supabase
      .from('track_tags')
      .select('tracks(spotify_id, name, artist_names, album_art_url, duration_ms, uri)')
      .eq('tag_id', tagId)
      .eq('user_id', uid)
    const rows = (data ?? []).map(r => r.tracks as DBTrack | null).filter(Boolean) as DBTrack[]
    setTracks(rows.map(dbToTrack))
  }

  useEffect(() => {
    if (!userId) return
    fetchTags(userId)

    const channel = supabase
      .channel('tags-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags', filter: `user_id=eq.${userId}` }, () => {
        fetchTags(userId)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_tags', filter: `user_id=eq.${userId}` }, () => {
        fetchTags(userId)
        if (selectedRef.current) fetchTracks(userId, selectedRef.current.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    if (!userId || !selected) { setTracks([]); return }
    setLoadingTracks(true)
    fetchTracks(userId, selected.id).then(() => setLoadingTracks(false))
  }, [selected?.id, userId])

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

  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      <div
        className="flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: selected ? '70%' : '100%' }}
      >
        {loadingTags ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">No tags yet — tag songs in search</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 p-3 overflow-y-auto scrollbar-none">
            {tags.map(tag => {
              const color = tagColor(tag.id)
              const isSelected = selected?.id === tag.id
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelected(isSelected ? null : tag)}
                  className={`flex flex-row items-center gap-1 p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gray-200 border-white shadow-inner'
                      : 'bg-gray-100 border-gray-300 shadow-md'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px 2px ${color}66` }}
                  />
                  <p className="text-sm font-semibold text-black truncate">{tag.name}</p>
                  <p className="text-xs text-gray-400">{tag.count} {tag.count === 1 ? 'track' : 'tracks'}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="overflow-hidden transition-all duration-300 border-l border-gray-200"
        style={{ width: selected ? '30%' : '0' }}
      >
        {selected && (
          <div className="flex flex-col h-full p-3 gap-3" style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }}>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-black transition-colors shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tagColor(selected.id) }} />
              <p className="text-sm font-semibold text-black truncate">{selected.name}</p>
            </div>

            {loadingTracks ? (
              <ul className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => <SongChipSkeleton key={i} />)}
              </ul>
            ) : tracks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-4">No tracks tagged</p>
            ) : (
              <ul className="flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-none">
                {tracks.map(track => (
                  <SongChip
                    key={track.id}
                    track={track}
                    isActive={playingUri === track.uri}
                    onClick={playTrack}
                    onPause={pauseTrack}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
