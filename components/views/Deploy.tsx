'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAllTags, useCategories, useTrackIdsByTagIds } from '@/lib/contexts/TagDataContext'
import { usePlayback } from '@/lib/contexts/PlaybackContext'
import { tagColor } from '@/components/ui/TagChip'
import SongChip, { SongChipSkeleton } from '@/components/ui/SongChip'
import { dbToTrack, type DBTrack } from '@/lib/spotify/dbTrack'
import type { Track } from '@/types/spotify'

const supabase = createClient()

type DeployResult = {
  total: number
  url: string
  played: boolean
  playError: string | null
}

function formatDuration(ms: number) {
  const m = Math.round(ms / 60000)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function TogglePill({ options, value, onChange }: {
  options: [string, string]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-full bg-gray-200 p-0.5 text-xs font-medium">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-full transition-all ${
            value === opt ? 'bg-white shadow-sm text-black' : 'text-gray-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function DeployView() {
  const allTags = useAllTags()
  const categories = useCategories()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<'any' | 'all'>('any')
  const [shuffle, setShuffle] = useState(true)
  const [queue, setQueue] = useState<Track[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [result, setResult] = useState<DeployResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { playingUri, playTrack, pauseTrack } = usePlayback()

  const trackIds = useTrackIdsByTagIds(selected, mode)
  const trackIdsKey = useMemo(() => [...trackIds].sort().join(','), [trackIds])

  useEffect(() => {
    if (!trackIds.length) {
      setQueue([])
      return
    }
    let cancelled = false
    setLoadingQueue(true)
    supabase
      .from('tracks')
      .select('spotify_id, name, artist_names, album_art_url, duration_ms, uri')
      .in('spotify_id', trackIds)
      .then(({ data }) => {
        if (cancelled) return
        const tracks = ((data ?? []) as DBTrack[]).map(dbToTrack)
        setQueue(shuffle ? shuffled(tracks) : tracks.sort((a, b) => a.name.localeCompare(b.name)))
        setLoadingQueue(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdsKey, shuffle])

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const deploy = async () => {
    if (!queue.length) return
    setDeploying(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/spotify/playlists/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: queue.map(t => t.uri) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Deploy failed')
      } else {
        setResult(json)
      }
    } catch {
      setError('Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      <div className="flex flex-col w-1/2 border-r border-gray-300 h-full overflow-hidden">
        <h1 className="text-xl font-bold px-4 py-4 shrink-0">Deploy to Spotify</h1>
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 flex flex-col gap-3">
          {(() => {
            const sorted = [...allTags].sort((a, b) => a.name.localeCompare(b.name))
            const catOrder = categories.map(c => c.id)
            const byCat: Record<string, typeof sorted> = {}
            const uncategorized: typeof sorted = []
            for (const tag of sorted) {
              if (tag.category_id && catOrder.includes(tag.category_id)) {
                (byCat[tag.category_id] ??= []).push(tag)
              } else {
                uncategorized.push(tag)
              }
            }
            const sections: { label: string | null; tags: typeof sorted }[] = [
              ...categories.filter(c => byCat[c.id]?.length).map(c => ({ label: c.name, tags: byCat[c.id] })),
              ...(uncategorized.length ? [{ label: categories.length ? 'Uncategorized' : null, tags: uncategorized }] : []),
            ]
            return sections.map(({ label, tags }) => (
              <div key={label ?? '__none'} className="flex flex-col gap-1.5">
                {label && <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-1">{label}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const color = tag.color ?? tagColor(tag.id)
                    const active = selected.has(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggle(tag.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                          active ? 'bg-gray-200 border-white shadow-inner' : 'bg-gray-100 border-gray-300 shadow-sm'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 transition-colors duration-150"
                          style={{ background: active ? color : '#d1d5db' }}
                        />
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
        <div className="shrink-0 px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <TogglePill
              options={['any', 'all']}
              value={mode}
              onChange={v => setMode(v as 'any' | 'all')}
            />
            <TogglePill
              options={['shuffle', 'ordered']}
              value={shuffle ? 'shuffle' : 'ordered'}
              onChange={v => setShuffle(v === 'shuffle')}
            />
          </div>
          <button
            onClick={deploy}
            disabled={queue.length === 0 || loadingQueue || deploying}
            className="w-full py-1.5 rounded-full bg-gray-100 border border-gray-300 shadow-md text-sm font-semibold text-black transition-all hover:bg-gray-200 active:shadow-inner disabled:opacity-40 disabled:pointer-events-none"
          >
            {deploying
              ? 'Deploying…'
              : `Deploy (${queue.length} track${queue.length === 1 ? '' : 's'} · ${formatDuration(queue.reduce((s, t) => s + t.duration_ms, 0))})`}
          </button>
        </div>
      </div>

      <div className="flex flex-col w-1/2 h-full overflow-hidden">
        <div className="flex items-baseline justify-between px-4 py-4 shrink-0">
          <p className="text-xl font-bold">Queue</p>
          {result && (
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 underline underline-offset-2"
            >
              Open in Spotify
            </a>
          )}
        </div>
        {error && <p className="text-xs text-red-400 px-4 pb-2">{error}</p>}
        {result && (
          <p className={`text-xs px-4 pb-2 ${result.played ? 'text-gray-500' : 'text-amber-500'}`}>
            {result.played
              ? `Deployed ${result.total} tracks — now playing.`
              : `Deployed ${result.total} tracks, but playback didn’t start${result.playError ? ` — ${result.playError}` : ''}. Open Spotify on a device and try again.`}
          </p>
        )}
        <ul className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-2 px-4 pb-4 mask-[linear-gradient(to_bottom,transparent,black_20px)] pt-1">
          {loadingQueue
            ? Array.from({ length: 6 }).map((_, i) => <SongChipSkeleton key={i} />)
            : queue.length === 0
              ? <p className="text-xs text-gray-400 text-center pt-4">Select tags to build a queue</p>
              : queue.map(track => (
                <SongChip
                  key={track.id}
                  track={track}
                  isActive={playingUri === track.uri}
                  onClick={t => playTrack(t, queue)}
                  onPause={pauseTrack}
                />
              ))
          }
        </ul>
      </div>
    </div>
  )
}
