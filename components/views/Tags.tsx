'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CategoryFilterChips from '@/components/views/tags/CategoryFilterChips'
import EmptyState, { type TagPreset } from '@/components/views/tags/EmptyState'
import NewTagDialog from '@/components/views/tags/NewTagDialog'
import SparseState from '@/components/views/tags/SparseState'
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

const SPARSE_MAX = 3

export default function TagsView({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const uid = useUid()
  const loaded = useTagDataLoaded()
  const allTags = useAllTagsWithCount()
  const categories = useCategories()
  const albumArts = useTagAlbumArts()
  const recentByTag = useRecentTaggedAtByTag()
  const recentlyTagged = useUniqueRecentlyTagged(6)
  const trackCount = useTaggedTrackCount()
  const { addCategoryLocal, patchCategory, removeCategoryLocal, patchTag, removeTagLocal } = useTagMutators()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<TagSort>('category')
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set())
  // null = closed; {} = blank dialog; preset fields pre-fill it
  const [newTag, setNewTag] = useState<Partial<TagPreset> | null>(null)
  const [editingTags, setEditingTags] = useState(false)

  // Dev-only screen-state preview: /?tagsState=empty or /?tagsState=sparse
  const [stateOverride] = useState<string | null>(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return null
    return new URLSearchParams(window.location.search).get('tagsState')
  })
  const tags = stateOverride === 'empty' ? [] : stateOverride === 'sparse' ? allTags.slice(0, SPARSE_MAX) : allTags

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
    const sort_order = categories.length
    const { data } = await supabase
      .from('tag_categories')
      .insert({ name, user_id: uid, sort_order })
      .select('id, name, sort_order')
      .single()
    if (data) addCategoryLocal(data)
    return data
  }

  const reorderCategory = (fromId: string, toId: string) => {
    const fromIdx = categories.findIndex(c => c.id === fromId)
    const toIdx = categories.findIndex(c => c.id === toId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
    const reordered = [...categories]
    const [item] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, item)
    reordered.forEach((cat, i) => patchCategory(cat.id, { sort_order: i }))
    Promise.all(reordered.map((cat, i) =>
      supabase.from('tag_categories').update({ sort_order: i }).eq('id', cat.id)
    ))
  }

  const reorderTag = (fromId: string, toId: string) => {
    const fromTag = allTags.find(t => t.id === fromId)
    if (!fromTag) return
    const group = allTags
      .filter(t => t.category_id === fromTag.category_id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const fromIdx = group.findIndex(t => t.id === fromId)
    const toIdx = group.findIndex(t => t.id === toId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
    const reordered = [...group]
    const [item] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, item)
    reordered.forEach((tag, i) => patchTag(tag.id, { sort_order: i }))
    Promise.all(reordered.map((tag, i) =>
      supabase.from('tags').update({ sort_order: i }).eq('id', tag.id)
    ))
  }

  const deleteTag = async (id: string) => {
    if (!uid) return
    if (selectedId === id) setSelectedId(null)
    removeTagLocal(id)
    await supabase.from('tags').delete().eq('id', id).eq('user_id', uid)
  }

  const deleteCategory = async (id: string) => {
    if (!uid) return
    removeCategoryLocal(id)
    await Promise.all([
      supabase.from('tag_categories').delete().eq('id', id).eq('user_id', uid),
      supabase.from('tags').update({ category_id: null }).eq('category_id', id).eq('user_id', uid),
    ])
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!loaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <EmptyState onCreate={preset => setNewTag(preset ?? {})} onOpenSearch={onOpenSearch} />
      ) : (
        <>
          <TagsHeaderStrip
            tagCount={tags.length}
            categoryCount={categories.length}
            trackCount={trackCount}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            onNewTag={() => setNewTag({})}
            editMode={editingTags}
            onToggleEdit={() => setEditingTags(e => !e)}
          />
          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <CategoryFilterChips
                categories={categoriesWithCount}
                totalCount={tags.length}
                active={categoryFilter}
                onToggle={toggleCategory}
                onClear={() => setCategoryFilter(new Set())}
                onCreate={createCategory}
                onReorder={reorderCategory}
                onDelete={deleteCategory}
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
                editMode={editingTags}
                onReorder={reorderTag}
                onDeleteTag={deleteTag}
              >
                {tags.length <= SPARSE_MAX && (
                  <SparseState
                    existingNames={tags.map(t => t.name)}
                    onSuggest={preset => setNewTag(preset)}
                  />
                )}
              </TagGrid>
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
        </>
      )}
      {newTag && (
        <NewTagDialog
          categories={categories}
          initialName={newTag.name}
          initialHue={newTag.hue}
          onClose={() => setNewTag(null)}
          onCreated={tag => { setNewTag(null); setSelectedId(tag.id) }}
          onCreateCategory={createCategory}
        />
      )}
    </div>
  )
}
