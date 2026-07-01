'use client'

import { useEffect, useRef, useState } from 'react'

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  duration_ms: number
}

function msToMinSec(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function SearchView() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) { setTracks([]); setError(null); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(() => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&market=from_token`, {
        signal: abortRef.current.signal,
      })
        .then(r => r.json())
        .then(({ data, error: apiError }) => {
          if (apiError) { setError(apiError); return }
          setError(null)
          setTracks(data?.tracks?.items ?? [])
        })
        .catch(err => { if (err.name !== 'AbortError') setError('Search failed') })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full px-3 py-2 rounded-full bg-gray-200 border border-gray-200 shadow-inner text-sm outline-none placeholder:text-gray-400"
          autoFocus
        />
      </div>

      {loading && <p className="text-xs text-gray-400 px-3 py-2">Searching…</p>}
      {error && <p className="text-xs text-red-400 px-3 py-2">{error}</p>}

      <ul className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 pb-3">
        {tracks.map(track => {
          const thumb = track.album.images.at(-1)?.url
          return (
            <li
              key={track.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100 border border-gray-300 shadow-md"
            >
              <div className="w-9 h-9 shrink-0 rounded bg-gray-200 border border-gray-200 shadow-inner overflow-hidden">
                {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{track.name}</p>
                <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 tabular-nums">{msToMinSec(track.duration_ms)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
