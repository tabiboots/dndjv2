'use client'

import { useMemo } from 'react'
import SongChip from '@/components/ui/SongChip'
import TagCard from '@/components/views/tags/TagCard'
import type { TagSort } from '@/components/views/tags/SortMenu'
import type { Category, Tag } from '@/lib/contexts/TagDataContext'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import type { Track } from '@/types/spotify'

type TagWithCount = Tag & { count: number }

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
}) {
  const { playingUri, playTrack, pauseTrack } = usePlayback()

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

  const renderCards = (list: TagWithCount[]) => (
    <div className="grid grid-cols-6 gap-4 auto-rows-fr">
      {list.map(tag => (
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

  return (
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
          <ul className="grid grid-cols-2 xl:grid-cols-3 gap-2">
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
    </div>
  )
}
