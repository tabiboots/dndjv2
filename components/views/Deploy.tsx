'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAllTags, useTrackIdsByTagIds } from '@/lib/contexts/TagDataContext'
import { tagColor } from '@/components/ui/TagChip'

const supabase = createClient()

export default function DeployView() {
  const tags = useAllTags().sort((a, b) => a.name.localeCompare(b.name))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deploying, setDeploying] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const trackIds = useTrackIdsByTagIds(selected)

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const deploy = async () => {
    if (!trackIds.length) return
    setDeploying(true)
    setResult(null)
    try {
      const { data: rows } = await supabase
        .from('tracks')
        .select('uri')
        .in('spotify_id', trackIds)

      const uris = (rows ?? []).map(r => r.uri)

      const res = await fetch('/api/spotify/playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris }),
      })
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      <div className="flex flex-col w-1/2 border-r border-gray-300 h-full overflow-hidden">
        <h1 className="text-xl font-bold px-4 py-4 shrink-0">Deploy to Spotify</h1>
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 flex flex-col gap-2">
          {tags.map(tag => {
            const color = tag.color ?? tagColor(tag.id)
            const active = selected.has(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                  active ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-sm'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm font-medium text-black">{tag.name}</span>
              </button>
            )
          })}
        </div>
        <div className="shrink-0 px-4 py-4">
          <button
            onClick={deploy}
            disabled={selected.size === 0 || deploying}
            className="w-full py-2 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-30 transition-opacity"
          >
            {deploying ? 'Deploying…' : `Deploy (${trackIds.length} tracks)`}
          </button>
        </div>
      </div>

      <div className="flex flex-col w-1/2 h-full overflow-hidden">
        <p className="text-xl font-bold px-4 py-4 shrink-0">Queue</p>
        {result && (
          <pre className="flex-1 overflow-y-auto scrollbar-none px-4 text-xs text-gray-600 font-mono whitespace-pre-wrap break-all">
            {result}
          </pre>
        )}
      </div>
    </div>
  )
}
