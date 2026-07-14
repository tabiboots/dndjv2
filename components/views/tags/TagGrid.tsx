'use client'

import { useMemo, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SongChip from '@/components/ui/SongChip'
import TagCard from '@/components/views/tags/TagCard'
import type { TagSort } from '@/components/views/tags/SortMenu'
import type { Category, Tag } from '@/lib/contexts/TagDataContext'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import type { Track } from '@/types/spotify'

type TagWithCount = Tag & { count: number }

function SortableTagCard({
  tag, albumArts, isSelected, onSelect, onRequestDelete,
}: {
  tag: TagWithCount
  albumArts?: string[]
  isSelected: boolean
  onSelect: () => void
  onRequestDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`jiggle cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      >
        <TagCard tag={tag} count={tag.count} albumArts={albumArts} isSelected={isSelected} onSelect={onSelect} />
      </div>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={() => onRequestDelete(tag.id)}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-600/80 text-white flex items-center justify-center text-sm leading-none hover:bg-red-500 transition-colors"
      >
        
      </button>
    </div>
  )
}

export default function TagGrid({
  tags,
  categories,
  albumArts,
  recentByTag,
  sort,
  search,
  categoryFilter,
  selectedId,
  onSelect,
  recentlyTagged,
  editMode,
  onReorder,
  onDeleteTag,
  children,
}: {
  tags: TagWithCount[]
  categories: Category[]
  albumArts: Record<string, string[]>
  recentByTag: Record<string, string>
  sort: TagSort
  search: string
  categoryFilter: Set<string>
  selectedId: string | null
  onSelect: (id: string) => void
  recentlyTagged: Track[]
  editMode: boolean
  onReorder: (fromId: string, toId: string) => void
  onDeleteTag: (id: string) => Promise<void>
  children?: React.ReactNode
}) {
  const { playingUri, playTrack, pauseTrack } = usePlayback()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tags.filter(t =>
      (!q || t.name.toLowerCase().includes(q)) &&
      (categoryFilter.size === 0 || (t.category_id && categoryFilter.has(t.category_id)))
    )
  }, [tags, search, categoryFilter])

  const sorted = useMemo(() => {
    const byName = (a: TagWithCount, b: TagWithCount) => a.name.localeCompare(b.name)
    switch (sort) {
      case 'alpha': return [...filtered].sort(byName)
      case 'tracks': return [...filtered].sort((a, b) => b.count - a.count || byName(a, b))
      case 'recent': return [...filtered].sort((a, b) =>
        (recentByTag[b.id] ?? '').localeCompare(recentByTag[a.id] ?? '') || byName(a, b))
      case 'category': return [...filtered].sort((a, b) => a.sort_order - b.sort_order)
      default: return [...filtered].sort(byName)
    }
  }, [filtered, sort, recentByTag])

  const grouped = useMemo(() => {
    if (sort !== 'category') return []
    return categories
      .map(cat => ({ cat, tags: sorted.filter(t => t.category_id === cat.id) }))
      .filter(g => g.tags.length > 0)
  }, [sort, categories, sorted])
  const uncategorized = sort === 'category' ? sorted.filter(t => !t.category_id) : []

  const confirmingTag = confirmDeleteId ? tags.find(t => t.id === confirmDeleteId) : null

  const makeDragEnd = (groupTags: TagWithCount[]) => (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) onReorder(active.id as string, over.id as string)
  }

  const renderCards = (list: TagWithCount[]) => {
    if (editMode && sort === 'category') {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEnd(list)} modifiers={[restrictToParentElement]}>
          <SortableContext items={list.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-6 gap-4 auto-rows-fr">
              {list.map(tag => (
                <SortableTagCard
                  key={tag.id}
                  tag={tag}
                  albumArts={albumArts[tag.id]}
                  isSelected={selectedId === tag.id}
                  onSelect={() => onSelect(tag.id)}
                  onRequestDelete={setConfirmDeleteId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )
    }

    return (
      <div className="grid grid-cols-6 gap-4 auto-rows-fr">
        {list.map(tag => editMode ? (
          <div key={tag.id} className="relative">
            <div className="jiggle">
              <TagCard tag={tag} count={tag.count} albumArts={albumArts[tag.id]} isSelected={selectedId === tag.id} onSelect={() => onSelect(tag.id)} />
            </div>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setConfirmDeleteId(tag.id)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-600/80 text-white flex items-center justify-center text-sm leading-none hover:bg-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <TagCard
            key={tag.id}
            tag={tag}
            count={tag.count}
            albumArts={albumArts[tag.id]}
            isSelected={selectedId === tag.id}
            onSelect={() => onSelect(tag.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {confirmingTag && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-black">Delete "{confirmingTag.name}"?</p>
            <p className="text-xs text-gray-500">The tag and all its track associations will be removed.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-1.5 rounded-xl bg-gray-100 border border-gray-300 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDeleteTag(confirmingTag.id); setConfirmDeleteId(null) }}
                className="flex-1 py-1.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none p-3 flex flex-col gap-4">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-8">No tags match</p>
        ) : sort === 'category' ? (
          <>
            {grouped.map(({ cat, tags: catTags }) => (
              <div key={cat.id}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat.name}</p>
                {renderCards(catTags)}
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                {grouped.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Uncategorized</p>
                )}
                {renderCards(uncategorized)}
              </div>
            )}
          </>
        ) : (
          renderCards(sorted)
        )}
        {recentlyTagged.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recently tagged</p>
            <ul className="grid grid-cols-2 xl:grid-cols-1 gap-2">
              {recentlyTagged.map(track => (
                <SongChip
                  key={track.id}
                  track={track}
                  isActive={playingUri === track.uri}
                  onClick={t => playTrack(t, recentlyTagged)}
                  onPause={pauseTrack}
                />
              ))}
            </ul>
          </div>
        )}
        {children}
      </div>
    </>
  )
}