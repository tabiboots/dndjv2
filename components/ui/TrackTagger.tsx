'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Track } from '@/types/spotify'
import IconButton from '@/components/ui/IconButton'
import TagChip from '@/components/ui/TagChip'

type Tag = { id: string; name: string }

export default function TrackTagger({ track, onClose }: { track: Track; onClose: () => void }) {
  const supabase = createClient()
  const art = track.album.images[0]?.url

  const [userId, setUserId] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    if (!userId || !track.id) return
    Promise.all([
      supabase.from('tags').select('id,name').eq('user_id', userId).order('name'),
      supabase.from('track_tags').select('tag_id').eq('spotify_id', track.id).eq('user_id', userId),
    ]).then(([{ data: tagRows }, { data: ttRows }]) => {
      setTags(tagRows ?? [])
      setApplied(new Set((ttRows ?? []).map(r => r.tag_id)))
    })
  }, [userId, track.id])

  const upsertTrack = async () => {
    const { error } = await supabase.from('tracks').upsert(
      {
        spotify_id: track.id!,
        name: track.name,
        artist_names: track.artists.map(a => a.name),
        album_art_url: track.album.images[0]?.url ?? null,
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
    const name = newTag.trim()
    if (!userId || !name || !track.id) return

    const color = `hsl(${Math.floor(Math.random() * 360)}, 65%, 55%)`
    const { data } = await supabase.from('tags').insert({ name, color, user_id: userId }).select('id,name').single()
    if (!data) return

    const err = await upsertTrack()
    if (err) return
    const { error: ttErr } = await supabase.from('track_tags').insert({ tag_id: data.id, spotify_id: track.id, user_id: userId })
    if (ttErr) { console.error('track_tags insert (create):', ttErr); return }

    setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setApplied(prev => new Set([...prev, data.id]))
    setNewTag('')
  }

  return (
    <div style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }} className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center justify-between">
        <IconButton onClick={onClose} className="w-7 h-7 text-sm">×</IconButton>
      </div>

      <div className="flex flex-col gap-1 items-center">
        {art && <img src={art} alt="" className="w-40 aspect-square object-cover rounded-lg shadow-xl border-2 border-gray-200" />}
        <p className="text-medium pt-2 font-medium text-black truncate">{track.name}</p>
        <p className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-wrap content-start gap-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {tags.map(tag => (
          <button key={tag.id} onClick={() => toggle(tag)}>
            <TagChip id={tag.id} name={tag.name} active={applied.has(tag.id)} />
          </button>
        ))}
      </div>

      <div className="pb-4">
        <form onSubmit={createTag} className="flex flex-row items-center justify-around">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="Create a new tag..."
            className="w-5/6 px-3 py-3 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-sm outline-none text-black placeholder:text-gray-400"
          />
          <IconButton type="submit" className="w-12 h-12">
            <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </IconButton>
        </form>
      </div>
    </div>
  )
}
