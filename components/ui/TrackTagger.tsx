'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Track } from '@/types/spotify'
import { tagColor } from '@/components/ui/TagChip'
import { useAllTags, useCategories, useTagColor, useTagMutators, useUid, type Tag } from '@/lib/contexts/TagDataContext'

const supabase = createClient()

function Chip({ tag, active, onClick }: { tag: Tag; active: boolean; onClick: () => void }) {
  const color = useTagColor(tag.id) ?? tagColor(tag.id)
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
        active
          ? 'bg-gray-200 border border-white shadow-inner te  xt-black'
          : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0 transition-all duration-100"
        style={active ? { background: color, boxShadow: `0 0 5px 2px ${color}88` } : { background: '#d1d5db' }}
      />
      {tag.name.toLowerCase()}
    </button>
  )
}

export default function TrackTagger({ track, onClose }: { track: Track; onClose: () => void }) {
  const art = track.album.images?.[0]?.url
  const userId = useUid()
  const allTags = useAllTags()
  const categories = useCategories()
  const { addTagLocal } = useTagMutators()

  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!userId || !track.id) return
    supabase.from('track_tags').select('tag_id')
      .eq('spotify_id', track.id).eq('user_id', userId)
      .then(({ data }) => setApplied(new Set((data ?? []).map(r => r.tag_id))))
  }, [userId, track.id])

  const groups = useMemo(() => {
    const q = filter.toLowerCase()
    const visible = q ? allTags.filter(t => t.name.toLowerCase().includes(q)) : allTags
    const result = categories
      .map(cat => ({ label: cat.name, tags: visible.filter(t => t.category_id === cat.id) }))
      .filter(g => g.tags.length > 0)
    const uncategorized = visible.filter(t => !t.category_id)
    if (uncategorized.length > 0) result.push({ label: 'other', tags: uncategorized })
    return result
  }, [allTags, categories, filter])

  const upsertTrack = async () => {
    const { error } = await supabase.from('tracks').upsert(
      {
        spotify_id: track.id!,
        name: track.name,
        artist_names: track.artists.map(a => a.name),
        album_art_url: track.album.images?.[0]?.url ?? null,
        duration_ms: track.duration_ms,
        uri: track.uri,
      },
      { onConflict: 'spotify_id', ignoreDuplicates: true }
    )
    if (error) console.error('tracks upsert:', error)
    return error
  }

  const toggle = async (tag: Tag) => {
    if (!userId || !track.id) return
    if (applied.has(tag.id)) {
      await supabase.from('track_tags').delete()
        .eq('tag_id', tag.id).eq('spotify_id', track.id).eq('user_id', userId)
      setApplied(prev => { const s = new Set(prev); s.delete(tag.id); return s })
    } else {
      const err = await upsertTrack()
      if (err) return
      const { error: ttErr } = await supabase.from('track_tags').insert({ tag_id: tag.id, spotify_id: track.id, user_id: userId })
      if (ttErr) { console.error('track_tags insert:', ttErr); return }
      setApplied(prev => new Set([...prev, tag.id]))
    }
  }

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = filter.trim()
    if (!userId || !name || !track.id) return

    const color = `hsl(${Math.floor(Math.random() * 360)}, 65%, 55%)`
    const { data } = await supabase.from('tags').insert({ name, color, user_id: userId }).select('id,name,color,sort_order').single()
    if (!data) return
    addTagLocal({ ...data, category_id: null })

    const err = await upsertTrack()
    if (err) return
    const { error: ttErr } = await supabase.from('track_tags').insert({ tag_id: data.id, spotify_id: track.id, user_id: userId })
    if (ttErr) { console.error('track_tags insert (create):', ttErr); return }

    setApplied(prev => new Set([...prev, data.id]))
    setFilter('')
  }

  return (
    <div style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }} className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-black truncate">{track.name}</p>
          <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
        </div>
      </div>
      <div className="flex justify-around gap-2">
        {art && <img src={art} alt="" className="w-40 h-40 rounded object-cover shrink-0 border-2 border-gray-200" />}
      </div>

      {/* Tag groups */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {groups.length === 0 && (
          <p className="text-xs text-gray-400">{filter ? 'No matching tags' : 'No tags yet'}</p>
        )}
        {groups.map(group => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <p className="text-xs text-gray-400">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.tags.map(tag => (
                <Chip key={tag.id} tag={tag} active={applied.has(tag.id)} onClick={() => toggle(tag)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filter / create */}
      <form onSubmit={createTag} className="flex items-center gap-2 shrink-0 pb-2">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter or create tag..."
          className="flex-1 px-3 py-2 rounded-full bg-gray-100 border border-gray-300 text-xs text-black placeholder:text-gray-400 outline-none"
        />
        {filter.trim() && !allTags.some(t => t.name.toLowerCase() === filter.toLowerCase()) && (
          <button
            type="submit"
            className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors text-base leading-none shrink-0"
          >
            +
          </button>
        )}
      </form>
    </div>
  )
}