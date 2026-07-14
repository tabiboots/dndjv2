'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import SongChip from '@/components/ui/SongChip'
import { tagColor } from '@/components/ui/TagChip'
import ColorPicker from '@/components/views/tags/ColorPicker'
import { useTracksForTag, useUid, type Category, type Tag, type TrackTagRow } from '@/lib/contexts/TagDataContext'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import { hslToTriplet, tripletToHsl } from '@/lib/tagColors'
import type { DBTrack } from '@/lib/spotify/dbTrack'
import type { Track } from '@/types/spotify'

const supabase = createClient()

// Parent renders with key={tag.id} so state re-initializes per tag.
export default function TagDetailPanel({
  tag,
  categories,
  onClose,
  onCreateCategory,
}: {
  tag: Tag
  categories: Category[]
  onClose: () => void
  onCreateCategory: (name: string) => Promise<Category | null>
}) {
  const uid = useUid()
  const queryClient = useQueryClient()
  const tracks = useTracksForTag(tag.id)
  const { playingUri, playTrack, pauseTrack } = usePlayback()

  const [nameInput, setNameInput] = useState(tag.name)
  const initial = hslToTriplet(tag.color) ?? { h: 0, s: 65, l: 55 }
  const [hue, setHue] = useState(initial.h)
  const [sat, setSat] = useState(initial.s)
  const [lit, setLit] = useState(initial.l)
  const [newCatInput, setNewCatInput] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const activeColor = tag.color ?? tagColor(tag.id)

  const updateTag = useMutation({
    mutationFn: async (patch: Partial<Tag>) => {
      await supabase.from('tags').update(patch).eq('id', tag.id).eq('user_id', uid!)
    },
    onMutate: (patch) => {
      queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
        prev?.map(t => t.id === tag.id ? { ...t, ...patch } : t) ?? [])
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', uid] })
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('tags').delete().eq('id', tag.id).eq('user_id', uid!)
    },
    onMutate: () => {
      queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
        prev?.filter(t => t.id !== tag.id) ?? [])
    },
    onSuccess: onClose,
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', uid] })
    },
  })

  const removeTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await supabase.from('track_tags').delete()
        .eq('tag_id', tag.id).eq('spotify_id', trackId).eq('user_id', uid!)
    },
    onMutate: (trackId) => {
      queryClient.setQueryData<{ rows: TrackTagRow[], tracksById: Record<string, DBTrack> }>(
        ['track-tags', uid],
        prev => prev ? { ...prev, rows: prev.rows.filter(r => !(r.tag_id === tag.id && r.spotify_id === trackId)) } : prev
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['track-tags', uid] })
    },
  })

  const saveName = () => {
    const name = nameInput.trim()
    if (!uid || !name || name === tag.name) return
    updateTag.mutate({ name })
  }

  // previewColor has no DB write — just updates the cache for live drag feedback
  const previewColor = (h: number, s: number, l: number) => {
    setHue(h); setSat(s); setLit(l)
    queryClient.setQueryData<Tag[]>(['tags', uid], prev =>
      prev?.map(t => t.id === tag.id ? { ...t, color: tripletToHsl(h, s, l) } : t) ?? [])
  }

  const commitColor = (h: number, s: number, l: number) => {
    setHue(h); setSat(s); setLit(l)
    updateTag.mutate({ color: tripletToHsl(h, s, l) })
  }

  const updateCategory = (category_id: string | null) => {
    if (!uid) return
    updateTag.mutate({ category_id })
  }

  const deleteTag = () => {
    if (!uid) return
    if (!confirm(`Delete tag "${tag.name}"? This will remove it from all songs.`)) return
    deleteTagMutation.mutate()
  }

  const doCreateCategory = async (name: string) => {
    const cat = await onCreateCategory(name)
    setNewCatInput('')
    setAddingCat(false)
    if (cat) updateCategory(cat.id)
  }

  return (
    <div
      className="w-[360px] h-full flex flex-col p-3 gap-3"
      style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeColor }} />
        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onBlur={saveName}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') { setNameInput(tag.name); e.currentTarget.blur() }
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
      <ColorPicker hue={hue} sat={sat} lit={lit} onPreview={previewColor} onCommit={commitColor} />

      {/* Category */}
      <div className="flex flex-col gap-1 shrink-0">
        <p className="text-xs text-gray-400">Category</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {categories.map(cat => {
            const isActive = tag.category_id === cat.id
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
            <form onSubmit={e => { e.preventDefault(); doCreateCategory(newCatInput.trim()) }}>
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
      {tracks.length === 0 ? (
        <p className="text-xs text-gray-400 text-center pt-4">No tracks tagged</p>
      ) : (
        <ul className="flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-none">
          {tracks.map(track => (
            <SongChip
              key={track.id}
              track={track}
              isActive={playingUri === track.uri}
              onClick={t => playTrack(t, tracks)}
              onPause={pauseTrack}
            >
              <button
                onClick={() => track.id && removeTrackMutation.mutate(track.id)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-1"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </SongChip>
          ))}
        </ul>
      )}
    </div>
  )
}