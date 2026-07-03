'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CategoryFilterChips from '@/components/views/tags/CategoryFilterChips'
import NewTagDialog from '@/components/views/tags/NewTagDialog'
import TagDetailPanel from '@/components/views/tags/TagDetailPanel'
import TagGrid from '@/components/views/tags/TagGrid'
import TagsHeaderStrip from '@/components/views/tags/TagsHeaderStrip'
import type { TagSort } from '@/components/views/tags/SortMenu'
import {
  useAllTagsWithCount,
  useCategories,
  useRecentTaggedAtByTag,
  useTagAlbumArts,
  useTagDataLoaded,
  useTaggedTrackCount,
  useTagMutators,
  useUid,
  useUniqueRecentlyTagged,
  type Category,
} from '@/lib/contexts/TagDataContext'

const supabase = createClient()

export default function TagsView() {
  const uid = useUid()
  const loaded = useTagDataLoaded()
  const tags = useAllTagsWithCount()
  const categories = useCategories()
  const albumArts = useTagAlbumArts()
  const recentByTag = useRecentTaggedAtByTag()
  const recentlyTagged = useUniqueRecentlyTagged(6)
  const trackCount = useTaggedTrackCount()
  const { addCategoryLocal } = useTagMutators()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<TagSort>('category')
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set())
  const [newTagOpen, setNewTagOpen] = useState(false)

  const selected = tags.find(t => t.id === selectedId) ?? null

  const categoriesWithCount = useMemo(
    () => categories.map(cat => ({ ...cat, count: tags.filter(t => t.category_id === cat.id).length })),
    [categories, tags]
  )

  const toggleCategory = (id: string) =>
    setCategoryFilter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const createCategory = async (name: string): Promise<Category | null> => {
    if (!uid || !name) return null
    const { data } = await supabase
      .from('tag_categories')
      .insert({ name, user_id: uid })
      .select('id, name')
      .single()
    if (data) addCategoryLocal(data)
    return data
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TagsHeaderStrip
        tagCount={tags.length}
        categoryCount={categories.length}
        trackCount={trackCount}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        onNewTag={() => setNewTagOpen(true)}
      />
      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!loaded ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400">No tags yet — create one above or tag songs in search</p>
            </div>
          ) : (
            <>
              <CategoryFilterChips
                categories={categoriesWithCount}
                totalCount={tags.length}
                active={categoryFilter}
                onToggle={toggleCategory}
                onClear={() => setCategoryFilter(new Set())}
                onCreate={createCategory}
              />
              <TagGrid
                tags={tags}
                categories={categories}
                albumArts={albumArts}
                recentByTag={recentByTag}
                sort={sort}
                search={search}
                categoryFilter={categoryFilter}
                selectedId={selectedId}
                onSelect={id => setSelectedId(prev => prev === id ? null : id)}
                recentlyTagged={recentlyTagged}
              />
            </>
          )}
        </div>
        <div
          className="overflow-hidden transition-all duration-300 border-l border-gray-200 bg-white shrink-0"
          style={{ width: selected ? 360 : 0 }}
        >
          {selected && (
            <TagDetailPanel
              key={selected.id}
              tag={selected}
              categories={categories}
              onClose={() => setSelectedId(null)}
              onCreateCategory={createCategory}
            />
          )}
        </div>
      </div>
      {newTagOpen && (
        <NewTagDialog
          categories={categories}
          onClose={() => setNewTagOpen(false)}
          onCreated={tag => { setNewTagOpen(false); setSelectedId(tag.id) }}
          onCreateCategory={createCategory}
        />
      )}
    </div>
  )
}
