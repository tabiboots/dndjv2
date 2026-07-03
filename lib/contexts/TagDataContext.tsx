'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { dbToTrack, type DBTrack } from '@/lib/spotify/dbTrack'
import type { Track } from '@/types/spotify'

export type Tag = { id: string; name: string; color: string | null; category_id: string | null }
export type Category = { id: string; name: string }
export type TrackTagRow = { spotify_id: string; tag_id: string; tagged_at: string }

type Mutators = {
  addTagLocal: (tag: Tag) => void
  patchTag: (id: string, patch: Partial<Tag>) => void
  removeTagLocal: (id: string) => void
  addCategoryLocal: (cat: Category) => void
  removeTrackTagLocal: (tagId: string, spotifyId: string) => void
}

type TagDataValue = Mutators & {
  uid: string | null
  loaded: boolean
  tags: Record<string, Tag>
  categories: Category[]
  trackTagRows: TrackTagRow[]
  trackTags: Record<string, string[]>
  tracksById: Record<string, DBTrack>
}

const noop = () => {}
const TagDataContext = createContext<TagDataValue>({
  uid: null,
  loaded: false,
  tags: {},
  categories: [],
  trackTagRows: [],
  trackTags: {},
  tracksById: {},
  addTagLocal: noop,
  patchTag: noop,
  removeTagLocal: noop,
  addCategoryLocal: noop,
  removeTrackTagLocal: noop,
})

export function useUid(): string | null {
  return useContext(TagDataContext).uid
}
export function useTagDataLoaded(): boolean {
  return useContext(TagDataContext).loaded
}
export function useTag(id: string): Tag | undefined {
  return useContext(TagDataContext).tags[id]
}
export function useTagColor(id: string): string | null {
  return useContext(TagDataContext).tags[id]?.color ?? null
}
export function useTrackTagIds(spotifyId: string | null | undefined): string[] {
  return useContext(TagDataContext).trackTags[spotifyId ?? ''] ?? []
}
export function useAllTags(): Tag[] {
  return Object.values(useContext(TagDataContext).tags)
}
export function useTrackIdsByTagIds(tagIds: Set<string>, mode: 'any' | 'all' = 'any'): string[] {
  const { trackTags } = useContext(TagDataContext)
  if (tagIds.size === 0) return []
  return Object.entries(trackTags)
    .filter(([, ids]) =>
      mode === 'any'
        ? ids.some(id => tagIds.has(id))
        : [...tagIds].every(id => ids.includes(id))
    )
    .map(([spotifyId]) => spotifyId)
}
export function useCategories(): Category[] {
  return useContext(TagDataContext).categories
}
export function useTaggedTrackCount(): number {
  return Object.keys(useContext(TagDataContext).trackTags).length
}
export function useAllTagsWithCount(): (Tag & { count: number })[] {
  const { tags, trackTagRows } = useContext(TagDataContext)
  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of trackTagRows) counts[row.tag_id] = (counts[row.tag_id] ?? 0) + 1
    return Object.values(tags).map(t => ({ ...t, count: counts[t.id] ?? 0 }))
  }, [tags, trackTagRows])
}
export function useTracksForTag(tagId: string | null | undefined): Track[] {
  const { trackTagRows, tracksById } = useContext(TagDataContext)
  return useMemo(() => {
    if (!tagId) return []
    return trackTagRows
      .filter(r => r.tag_id === tagId)
      .map(r => tracksById[r.spotify_id])
      .filter(Boolean)
      .map(dbToTrack)
  }, [tagId, trackTagRows, tracksById])
}
// rows are stored newest-first, so first occurrences win in all the hooks below
export function useTagAlbumArts(): Record<string, string[]> {
  const { trackTagRows, tracksById } = useContext(TagDataContext)
  return useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const row of trackTagRows) {
      const url = tracksById[row.spotify_id]?.album_art_url
      if (!url) continue
      const arts = (map[row.tag_id] ??= [])
      if (arts.length < 4 && !arts.includes(url)) arts.push(url)
    }
    return map
  }, [trackTagRows, tracksById])
}
export function useUniqueRecentlyTagged(n: number): Track[] {
  const { trackTagRows, tracksById } = useContext(TagDataContext)
  return useMemo(() => {
    const seen = new Set<string>()
    const out: Track[] = []
    for (const row of trackTagRows) {
      if (seen.has(row.spotify_id)) continue
      seen.add(row.spotify_id)
      const t = tracksById[row.spotify_id]
      if (t) out.push(dbToTrack(t))
      if (out.length >= n) break
    }
    return out
  }, [trackTagRows, tracksById, n])
}
export function useRecentTaggedAtByTag(): Record<string, string> {
  const { trackTagRows } = useContext(TagDataContext)
  return useMemo(() => {
    const map: Record<string, string> = {}
    for (const row of trackTagRows) map[row.tag_id] ??= row.tagged_at
    return map
  }, [trackTagRows])
}
export function useTagMutators(): Mutators {
  const { addTagLocal, patchTag, removeTagLocal, addCategoryLocal, removeTrackTagLocal } = useContext(TagDataContext)
  return { addTagLocal, patchTag, removeTagLocal, addCategoryLocal, removeTrackTagLocal }
}

const supabase = createClient()

export function TagDataProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [tags, setTags] = useState<Record<string, Tag>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [trackTagRows, setTrackTagRows] = useState<TrackTagRow[]>([])
  const [tracksById, setTracksById] = useState<Record<string, DBTrack>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!uid) return

    const loadTags = async () => {
      const { data } = await supabase.from('tags').select('id, name, color, category_id').eq('user_id', uid)
      const next: Record<string, Tag> = {}
      for (const t of data ?? []) next[t.id] = t
      setTags(next)
    }

    const loadCategories = async () => {
      const { data } = await supabase.from('tag_categories').select('id, name').eq('user_id', uid).order('name')
      setCategories(data ?? [])
    }

    const loadTrackTags = async () => {
      const { data } = await supabase
        .from('track_tags')
        .select('spotify_id, tag_id, tagged_at, tracks(spotify_id, name, artist_names, album_art_url, duration_ms, uri)')
        .eq('user_id', uid)
        .order('tagged_at', { ascending: false })
      const rows: TrackTagRow[] = []
      const byId: Record<string, DBTrack> = {}
      for (const r of data ?? []) {
        rows.push({ spotify_id: r.spotify_id, tag_id: r.tag_id, tagged_at: r.tagged_at })
        const track = r.tracks as unknown as DBTrack | null
        if (track) byId[track.spotify_id] = track
      }
      setTrackTagRows(rows)
      setTracksById(byId)
    }

    Promise.all([loadTags(), loadCategories(), loadTrackTags()]).then(() => setLoaded(true))

    const channel = supabase
      .channel('tag-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags',           filter: `user_id=eq.${uid}` }, loadTags)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tag_categories', filter: `user_id=eq.${uid}` }, loadCategories)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_tags',     filter: `user_id=eq.${uid}` }, loadTrackTags)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [uid])

  const trackTags = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const row of trackTagRows) (next[row.spotify_id] ??= []).push(row.tag_id)
    return next
  }, [trackTagRows])

  const addTagLocal = (tag: Tag) => setTags(prev => ({ ...prev, [tag.id]: tag }))
  const patchTag = (id: string, patch: Partial<Tag>) =>
    setTags(prev => prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev)
  const removeTagLocal = (id: string) =>
    setTags(prev => { const next = { ...prev }; delete next[id]; return next })
  const addCategoryLocal = (cat: Category) =>
    setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat].sort((a, b) => a.name.localeCompare(b.name)))
  const removeTrackTagLocal = (tagId: string, spotifyId: string) =>
    setTrackTagRows(prev => prev.filter(r => !(r.tag_id === tagId && r.spotify_id === spotifyId)))

  return (
    <TagDataContext.Provider value={{
      uid, loaded, tags, categories, trackTagRows, trackTags, tracksById,
      addTagLocal, patchTag, removeTagLocal, addCategoryLocal, removeTrackTagLocal,
    }}>
      {children}
    </TagDataContext.Provider>
  )
}
