'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTagsQuery } from '@/lib/hooks/useTagsQuery'
import { useCategoriesQuery } from '@/lib/hooks/useCategoriesQuery'
import { useTrackTagsQuery } from '@/lib/hooks/useTrackTagsQuery'
import { dbToTrack, type DBTrack } from '@/lib/spotify/dbTrack'
import type { Track } from '@/types/spotify'

export type Tag = { id: string; name: string; color: string | null; category_id: string | null; sort_order: number }
export type Category = { id: string; name: string; sort_order: number }
export type TrackTagRow = { spotify_id: string; tag_id: string; tagged_at: string }

type Mutators = {
  addTagLocal: (tag: Tag) => void
  patchTag: (id: string, patch: Partial<Tag>) => void
  removeTagLocal: (id: string) => void
  addCategoryLocal: (cat: Category) => void
  patchCategory: (id: string, patch: Partial<Category>) => void
  removeCategoryLocal: (id: string) => void
  addTrackTagLocal: (row: TrackTagRow, track: DBTrack) => void
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
  patchCategory: noop,
  removeCategoryLocal: noop,
  addTrackTagLocal: noop,
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
  const { addTagLocal, patchTag, removeTagLocal, addCategoryLocal, patchCategory, removeCategoryLocal, addTrackTagLocal, removeTrackTagLocal } = useContext(TagDataContext)
  return { addTagLocal, patchTag, removeTagLocal, addCategoryLocal, patchCategory, removeCategoryLocal, addTrackTagLocal, removeTrackTagLocal }
}

const supabase = createClient()

export function TagDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null))
  }, [])

  const tagsQuery = useTagsQuery(uid)
  const categoriesQuery = useCategoriesQuery(uid)
  const trackTagsQuery = useTrackTagsQuery(uid)

  const loaded = tagsQuery.isSuccess && categoriesQuery.isSuccess && trackTagsQuery.isSuccess

  const tags = useMemo(() => {
    const next: Record<string, Tag> = {}
    for (const t of tagsQuery.data ?? []) next[t.id] = t
    return next
  }, [tagsQuery.data])

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const trackTagRows = useMemo(() => trackTagsQuery.data?.rows ?? [], [trackTagsQuery.data])
  const tracksById = useMemo(() => trackTagsQuery.data?.tracksById ?? {}, [trackTagsQuery.data])

  useEffect(() => {
    if (!uid) return
    const channel = supabase
      .channel('tag-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags',           filter: `user_id=eq.${uid}` }, () => {
        void queryClient.refetchQueries({ queryKey: ['tags', uid] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tag_categories', filter: `user_id=eq.${uid}` }, () => {
        void queryClient.refetchQueries({ queryKey: ['categories', uid] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_tags',     filter: `user_id=eq.${uid}` }, () => {
        void queryClient.refetchQueries({ queryKey: ['track-tags', uid] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [uid, queryClient])

  const trackTags = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const row of trackTagRows) (next[row.spotify_id] ??= []).push(row.tag_id)
    return next
  }, [trackTagRows])

  // ponytail: mutators write to query cache directly for now; replaced by useMutation in Phase 4
  const addTagLocal = (tag: Tag) =>
    queryClient.setQueryData<Tag[]>(['tags', uid], prev => [...(prev ?? []), tag])

  const patchTag = (id: string, patch: Partial<Tag>) =>
    queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
      prev?.map(t => t.id === id ? { ...t, ...patch } : t) ?? [])

  const removeTagLocal = (id: string) =>
    queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
      prev?.filter(t => t.id !== id) ?? [])

  const addCategoryLocal = (cat: Category) =>
    queryClient.setQueryData<Category[]>(['categories', uid], prev =>
      [...(prev?.filter(c => c.id !== cat.id) ?? []), cat].sort((a, b) => a.sort_order - b.sort_order))

  const patchCategory = (id: string, patch: Partial<Category>) =>
    queryClient.setQueryData<Category[]>(['categories', uid], prev =>
      prev?.map(c => c.id === id ? { ...c, ...patch } : c).sort((a, b) => a.sort_order - b.sort_order) ?? [])

  const removeCategoryLocal = (id: string) => {
    queryClient.setQueryData<Category[]>(['categories', uid], prev => prev?.filter(c => c.id !== id) ?? [])
    queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
      prev?.map(t => t.category_id === id ? { ...t, category_id: null } : t) ?? [])
  }

  const addTrackTagLocal = (row: TrackTagRow, track: DBTrack) =>
    queryClient.setQueryData<{ rows: TrackTagRow[], tracksById: Record<string, DBTrack> }>(
      ['track-tags', uid],
      prev => prev
        ? { rows: [row, ...prev.rows], tracksById: { ...prev.tracksById, [track.spotify_id]: track } }
        : prev
    )

  const removeTrackTagLocal = (tagId: string, spotifyId: string) =>
    queryClient.setQueryData<{ rows: TrackTagRow[], tracksById: Record<string, DBTrack> }>(
      ['track-tags', uid],
      prev => prev ? { ...prev, rows: prev.rows.filter(r => !(r.tag_id === tagId && r.spotify_id === spotifyId)) } : prev
    )

  return (
    <TagDataContext.Provider value={{
      uid, loaded, tags, categories, trackTagRows, trackTags, tracksById,
      addTagLocal, patchTag, removeTagLocal, addCategoryLocal, patchCategory, removeCategoryLocal, addTrackTagLocal, removeTrackTagLocal,
    }}>
    {children}

    </TagDataContext.Provider>
  )
}
