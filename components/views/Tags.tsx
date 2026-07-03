'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SongChip, { SongChipSkeleton } from '@/components/ui/SongChip'
import { tagColor } from '@/components/ui/TagChip'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import type { Track } from '@/types/spotify'
import { dbToTrack, type DBTrack } from '@/lib/spotify/dbTrack'

type Tag = { id: string; name: string; count: number; color: string | null; category_id: string | null }
type Category = { id: string; name: string }

const supabase = createClient()

function TagCard({ tag, isSelected, onSelect }: { tag: Tag; isSelected: boolean; onSelect: () => void }) {
  const color = tag.color ?? tagColor(tag.id)
  return (
    <button
      onClick={onSelect}
      className={`flex flex-row items-center gap-1 p-4 rounded-2xl border text-left transition-all ${
        isSelected ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-md'
      }`}
    >
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px 2px ${color}66` }} />
      <p className="text-sm font-semibold text-black truncate">{tag.name}</p>
      <p className="text-xs text-gray-400">{tag.count} {tag.count === 1 ? 'track' : 'tracks'}</p>
    </button>
  )
}

export default function TagsView() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<Tag | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  const [loadingTracks, setLoadingTracks] = useState(false)
  const { playingUri, playTrack, pauseTrack } = usePlayback()
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(65)
  const [lit, setLit] = useState(55)
  const [nameInput, setNameInput] = useState('')
  const [newCatInput, setNewCatInput] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const selectedRef = useRef<Tag | null>(null)

  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => { setNameInput(selected?.name ?? '') }, [selected?.id])

  useEffect(() => {
    if (!selected?.color) { setHue(0); setSat(65); setLit(55); return }
    const match = selected.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%/)
    setHue(match ? parseInt(match[1]) : 0)
    setSat(match ? parseInt(match[2]) : 65)
    setLit(match ? parseInt(match[3]) : 55)
  }, [selected?.id])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const fetchTags = async (uid: string) => {
    const [{ data: tagData }, { data: catData }] = await Promise.all([
      supabase.from('tags').select('id, name, color, category_id, track_tags(spotify_id)').eq('user_id', uid).order('name'),
      supabase.from('tag_categories').select('id, name').eq('user_id', uid).order('name'),
    ])
    const rows = tagData ?? []
    const newTags = rows.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color ?? null,
      category_id: t.category_id ?? null,
      count: (t.track_tags as { spotify_id: string }[]).length,
    }))
    setTags(newTags)
    setCategories(catData ?? [])
    setLoadingTags(false)
    setSelected(prev => {
      if (!prev) return null
      return newTags.find(t => t.id === prev.id) ?? null
    })
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags', filter: `user_id=eq.${userId}` }, () => { fetchTags(userId) })
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

  const deleteTag = async () => {
    if (!userId || !selected) return
    if (!confirm(`Delete tag "${selected.name}"? This will remove it from all songs.`)) return
    await supabase.from('tags').delete().eq('id', selected.id).eq('user_id', userId)
    setSelected(null)
  }

  const saveName = async () => {
    const name = nameInput.trim()
    if (!userId || !selected || !name || name === selected.name) return
    await supabase.from('tags').update({ name }).eq('id', selected.id).eq('user_id', userId)
    setSelected(prev => prev ? { ...prev, name } : prev)
    setTags(prev => prev.map(t => t.id === selected.id ? { ...t, name } : t))
  }

  const updateColor = async (color: string) => {
    if (!userId || !selected) return
    await supabase.from('tags').update({ color }).eq('id', selected.id).eq('user_id', userId)
    const updated = { ...selected, color }
    setSelected(updated)
    setTags(prev => prev.map(t => t.id === selected.id ? { ...t, color } : t))
  }

  const updateCategory = async (category_id: string | null) => {
    if (!userId || !selected) return
    await supabase.from('tags').update({ category_id }).eq('id', selected.id).eq('user_id', userId)
    const updated = { ...selected, category_id }
    setSelected(updated)
    setTags(prev => prev.map(t => t.id === selected.id ? { ...t, category_id } : t))
  }

  const doCreateCategory = async (name: string) => {
    if (!userId || !name) return
    const { data } = await supabase
      .from('tag_categories')
      .insert({ name, user_id: userId })
      .select('id, name')
      .single()
    if (!data) return
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewCatInput('')
    setAddingCat(false)
    updateCategory(data.id)
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    await doCreateCategory(newCatInput.trim())
  }

  const removeTrack = async (track: Track) => {
    if (!userId || !selected || !track.id) return
    await supabase.from('track_tags').delete()
      .eq('tag_id', selected.id).eq('spotify_id', track.id).eq('user_id', userId)
    setTracks(prev => prev.filter(t => t.id !== track.id))
  }


const grouped = categories.map(cat => ({
    cat,
    tags: tags.filter(t => t.category_id === cat.id),
  })).filter(g => g.tags.length > 0)
  const uncategorized = tags.filter(t => !t.category_id)

  const activeColor = selected ? (selected.color ?? tagColor(selected.id)) : null

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
          <div className="overflow-y-auto scrollbar-none p-3 flex flex-col gap-4">
            {grouped.map(({ cat, tags: catTags }) => (
              <div key={cat.id}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat.name}</p>
                <div className="grid grid-cols-4 gap-3">
                  {catTags.map(tag => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      isSelected={selected?.id === tag.id}
                      onSelect={() => setSelected(selected?.id === tag.id ? null : tag)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                {grouped.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uncategorized</p>
                )}
                <div className="grid grid-cols-4 gap-3">
                  {uncategorized.map(tag => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      isSelected={selected?.id === tag.id}
                      onSelect={() => setSelected(selected?.id === tag.id ? null : tag)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="overflow-hidden transition-all duration-300 border-l border-gray-200"
        style={{ width: selected ? '30%' : '0' }}
      >
        {selected && (
          <div className="flex flex-col h-full p-3 gap-3" style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }}>
            {/* Header */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-black transition-colors shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeColor! }} />
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') { setNameInput(selected.name); e.currentTarget.blur() }
                }}
                className="text-sm font-semibold text-black flex-1 bg-transparent outline-none min-w-0"
              />
              <button
                onClick={deleteTag}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="relative h-4 rounded-full flex-1"
                style={{ background: 'linear-gradient(to right, hsl(0,65%,55%), hsl(30,65%,55%), hsl(60,65%,55%), hsl(90,65%,55%), hsl(120,65%,55%), hsl(150,65%,55%), hsl(180,65%,55%), hsl(210,65%,55%), hsl(240,65%,55%), hsl(270,65%,55%), hsl(300,65%,55%), hsl(330,65%,55%), hsl(360,65%,55%))' }}
              >
                <input
                  type="range" min="0" max="360"
                  value={hue}
                  onChange={e => {
                    const h = Number(e.target.value)
                    setHue(h)
                    const updated = { ...selected, color: `hsl(${h}, ${sat}%, ${lit}%)` }
                    setSelected(updated)
                    setTags(prev => prev.map(t => t.id === selected.id ? { ...t, color: updated.color } : t))
                  }}
                  onPointerUp={() => updateColor(`hsl(${hue}, ${sat}%, ${lit}%)`)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                  style={{ left: `${hue / 360 * 100}%`, transform: 'translate(-50%, -50%)', background: `hsl(${hue}, ${sat}%, ${lit}%)` }}
                />
              </div>
              {([{ s: 70, l: 32 }, { s: 65, l: 55 }, { s: 55, l: 78 }]).map(({ s, l }) => {
                const c = `hsl(${hue}, ${s}%, ${l}%)`
                const isActive = sat === s && lit === l
                return (
                  <button
                    key={s}
                    onClick={() => { setSat(s); setLit(l); updateColor(c) }}
                    className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-125"
                    style={{
                      background: c,
                      border: '1px solid #d1d5db',
                      boxShadow: isActive ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
                    }}
                  />
                )
              })}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1 shrink-0">
              <p className="text-xs text-gray-400">Category</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {categories.map(cat => {
                  const isActive = selected.category_id === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => updateCategory(isActive ? null : cat.id)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        isActive
                          ? 'bg-gray-200 border border-white shadow-inner text-black'
                          : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
                {addingCat ? (
                  <form onSubmit={createCategory}>
                    <input
                      autoFocus
                      value={newCatInput}
                      onChange={e => setNewCatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') { setAddingCat(false); setNewCatInput('') } }}
                      onBlur={() => {
                        const name = newCatInput.trim()
                        if (name) doCreateCategory(name)
                        else { setAddingCat(false); setNewCatInput('') }
                      }}
                      placeholder="Name..."
                      className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-300 text-xs text-black outline-none placeholder:text-gray-400 w-20"
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingCat(true)}
                    className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm leading-none"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Track list */}
            {(
              loadingTracks ? (
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
                    >
                      <button
                        onClick={() => removeTrack(track)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-1"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </SongChip>
                  ))}
                </ul>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
