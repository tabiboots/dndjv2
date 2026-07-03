'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ColorPicker from '@/components/views/tags/ColorPicker'
import { useTagMutators, useUid, type Category, type Tag } from '@/lib/contexts/TagDataContext'
import { tripletToHsl } from '@/lib/tagColors'

const supabase = createClient()

export default function NewTagDialog({
  categories,
  onClose,
  onCreated,
  onCreateCategory,
  initialName = '',
  initialHue,
}: {
  categories: Category[]
  onClose: () => void
  onCreated: (tag: Tag) => void
  onCreateCategory: (name: string) => Promise<Category | null>
  initialName?: string
  initialHue?: number
}) {
  const uid = useUid()
  const { addTagLocal } = useTagMutators()

  const [name, setName] = useState(initialName)
  const [hue, setHue] = useState(() => initialHue ?? Math.floor(Math.random() * 360))
  const [sat, setSat] = useState(65)
  const [lit, setLit] = useState(55)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [addingCat, setAddingCat] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const color = tripletToHsl(hue, sat, lit)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!uid || !trimmed || submitting) return
    setSubmitting(true)
    const { data } = await supabase
      .from('tags')
      .insert({ name: trimmed, color, category_id: categoryId, user_id: uid })
      .select('id, name, color, category_id, sort_order')
      .single()
    setSubmitting(false)
    if (!data) return
    addTagLocal(data)
    onCreated(data)
  }

  const createCategory = async (catName: string) => {
    const cat = await onCreateCategory(catName)
    setNewCatInput('')
    setAddingCat(false)
    if (cat) setCategoryId(cat.id)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-[380px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex flex-col gap-3"
        style={{ animation: 'pop 0.15s ease forwards' }}
      >
        <p className="text-sm font-semibold text-black">New tag</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px 2px ${color}66` }} />
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tag name..."
            className="flex-1 px-3 py-2 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-sm outline-none text-black placeholder:text-gray-400"
          />
        </div>
        <ColorPicker
          hue={hue} sat={sat} lit={lit}
          onPreview={(h, s, l) => { setHue(h); setSat(s); setLit(l) }}
          onCommit={(h, s, l) => { setHue(h); setSat(s); setLit(l) }}
        />
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-400">Category</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {categories.map(cat => {
              const isActive = categoryId === cat.id
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(isActive ? null : cat.id)}
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
              <input
                autoFocus
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { e.stopPropagation(); setAddingCat(false); setNewCatInput('') }
                  if (e.key === 'Enter') { e.preventDefault(); const n = newCatInput.trim(); if (n) createCategory(n) }
                }}
                onBlur={() => {
                  const n = newCatInput.trim()
                  if (n) createCategory(n)
                  else { setAddingCat(false); setNewCatInput('') }
                }}
                placeholder="Name..."
                className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-300 text-xs text-black outline-none placeholder:text-gray-400 w-20"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingCat(true)}
                className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm leading-none"
              >
                +
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-sm text-gray-500 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-300 shadow-md text-sm font-semibold text-black transition-all hover:bg-gray-200 active:shadow-inner disabled:opacity-40 disabled:pointer-events-none"
          >
            Create tag
          </button>
        </div>
      </form>
    </div>
  )
}
