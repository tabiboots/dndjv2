'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Tag = { id: string; name: string; color: string | null }

type TagDataValue = {
  uid: string | null
  tags: Record<string, Tag>
  trackTags: Record<string, string[]>
}

const TagDataContext = createContext<TagDataValue>({ uid: null, tags: {}, trackTags: {} })

export function useUid(): string | null {
  return useContext(TagDataContext).uid
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
export function useTrackIdsByTagIds(tagIds: Set<string>): string[] {
  const { trackTags } = useContext(TagDataContext)
  if (tagIds.size === 0) return []
  return Object.entries(trackTags)
    .filter(([, ids]) => ids.some(id => tagIds.has(id)))
    .map(([spotifyId]) => spotifyId)
}

const supabase = createClient()

export function TagDataProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null)
  const [tags, setTags] = useState<Record<string, Tag>>({})
  const [trackTags, setTrackTags] = useState<Record<string, string[]>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!uid) return

    const loadTags = async () => {
      const { data } = await supabase.from('tags').select('id, name, color').eq('user_id', uid)
      const next: Record<string, Tag> = {}
      for (const t of data ?? []) next[t.id] = t
      setTags(next)
    }

    const loadTrackTags = async () => {
      const { data } = await supabase.from('track_tags').select('spotify_id, tag_id').eq('user_id', uid)
      const next: Record<string, string[]> = {}
      for (const row of data ?? []) (next[row.spotify_id] ??= []).push(row.tag_id)
      setTrackTags(next)
    }

    loadTags()
    loadTrackTags()

    const channel = supabase
      .channel('tag-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags',       filter: `user_id=eq.${uid}` }, loadTags)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_tags', filter: `user_id=eq.${uid}` }, loadTrackTags)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [uid])

  return (
    <TagDataContext.Provider value={{ uid, tags, trackTags }}>
      {children}
    </TagDataContext.Provider>
  )
}
