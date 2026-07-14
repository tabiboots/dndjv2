'use client'

import { useRef, useState } from 'react'
import TrackChip from './TrackChip'
import PlayerControls from './PlayerControls'

export interface DisplayTrack {
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

interface Props {
  player: Spotify.Player | null
  playbackState: Spotify.PlaybackState | null
  isReady: boolean
  fallbackTrack?: DisplayTrack | null
  error?: string | null
  views: readonly string[]
  active: string
  onViewChange: (view: string) => void
}

export default function Footer({ player, playbackState, isReady, fallbackTrack, error, views, active, onViewChange }: Props) {
  const sdkTrack = playbackState?.track_window.current_track ?? null
  const track: DisplayTrack | null = sdkTrack ?? (isReady ? fallbackTrack ?? null : null)
  const activeIndex = views.indexOf(active)

  const [volume, setVolume] = useState(0.5)
  const volBarRef = useRef<HTMLDivElement>(null)
  const draggingVol = useRef(false)

  const pctFromVolEvent = (e: React.PointerEvent) => {
    const rect = volBarRef.current!.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }

  const onVolPointerDown = (e: React.PointerEvent) => {
    if (!player) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingVol.current = true
    const v = pctFromVolEvent(e)
    setVolume(v)
    player.setVolume(v)
  }

  const onVolPointerMove = (e: React.PointerEvent) => {
    if (!draggingVol.current || !player) return
    const v = pctFromVolEvent(e)
    setVolume(v)
    player.setVolume(v)
  }

  const onVolPointerUp = (e: React.PointerEvent) => {
    if (!draggingVol.current) return
    draggingVol.current = false
    const v = pctFromVolEvent(e)
    setVolume(v)
    player?.setVolume(v)
  }

  return (
    <div className="h-16 shrink-0 bg-white flex items-stretch shadow-[inset_0_1px_0_0_var(--color-gray-200),inset_0_2px_0_0_white]">

      {/* Left: track info */}
      <div className="flex-1 flex items-center px-4 min-w-0">
        <TrackChip track={track} isReady={isReady} error={error} />
      </div>

      {/* Center: controls + progress */}
      <div className="flex-1 flex items-center justify-center">
        <PlayerControls player={player} playbackState={playbackState} />
      </div>

      {/* Right: volume + view nav */}
      <div className="flex-1 flex items-center justify-end gap-3 px-4">
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
            {volume === 0
              ? <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              : volume < 0.5
              ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
              : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
            }
          </svg>
          <div
            className="group w-16 py-1.5 -my-1.5 cursor-pointer touch-none"
            onPointerDown={onVolPointerDown}
            onPointerMove={onVolPointerMove}
            onPointerUp={onVolPointerUp}
          >
            <div ref={volBarRef} className="h-1 bg-gray-200 rounded-full border border-gray-200 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-400 group-hover:bg-gray-500 transition-none"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative flex items-center bg-gray-200 rounded-full p-1 border border-gray-200 shadow-inner">
          <div
            className="absolute left-1 top-1 bottom-1 w-12 bg-gray-100 rounded-full shadow-sm transition-transform duration-200 ease-in-out"
            style={{ transform: `translateX(${activeIndex * 48}px)` }}
          />
          {views.map(view => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`relative z-10 w-12 h-9 flex items-center justify-center rounded-full transition-colors duration-200
                ${active === view ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label={view}
            >
              {view === 'Search' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {view === 'Tags' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11L13.4059 3.40589C12.887 2.88703 12.6276 2.6276 12.3249 2.44208C12.0564 2.27759 11.7638 2.15638 11.4577 2.08289C11.1124 2 10.7455 2 10.0118 2L6 2M3 8.7L3 10.6745C3 11.1637 3 11.4083 3.05526 11.6385C3.10425 11.8425 3.18506 12.0376 3.29472 12.2166C3.4184 12.4184 3.59136 12.5914 3.93726 12.9373L11.7373 20.7373C12.5293 21.5293 12.9253 21.9253 13.382 22.0737C13.7837 22.2042 14.2163 22.2042 14.618 22.0737C15.0747 21.9253 15.4707 21.5293 16.2627 20.7373L18.7373 18.2627C19.5293 17.4707 19.9253 17.0747 20.0737 16.618C20.2042 16.2163 20.2042 15.7837 20.0737 15.382C19.9253 14.9253 19.5293 14.5293 18.7373 13.7373L11.4373 6.43726C11.0914 6.09136 10.9184 5.9184 10.7166 5.79472C10.5376 5.68506 10.3425 5.60425 10.1385 5.55526C9.90829 5.5 9.6637 5.5 9.17452 5.5H6.2C5.0799 5.5 4.51984 5.5 4.09202 5.71799C3.7157 5.90973 3.40973 6.21569 3.21799 6.59202C3 7.01984 3 7.57989 3 8.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {view === 'Deploy' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.4995 13.5001L20.9995 3.00005M10.6271 13.8281L13.2552 20.5861C13.4867 21.1815 13.6025 21.4791 13.7693 21.566C13.9139 21.6414 14.0862 21.6415 14.2308 21.5663C14.3977 21.4796 14.5139 21.1821 14.7461 20.587L21.3364 3.69925C21.5461 3.16207 21.6509 2.89348 21.5935 2.72185C21.5437 2.5728 21.4268 2.45583 21.2777 2.40604C21.1061 2.34871 20.8375 2.45352 20.3003 2.66315L3.41258 9.25349C2.8175 9.48572 2.51997 9.60183 2.43326 9.76873C2.35809 9.91342 2.35819 10.0857 2.43353 10.2303C2.52043 10.3971 2.81811 10.5128 3.41345 10.7444L10.1715 13.3725C10.2923 13.4195 10.3527 13.443 10.4036 13.4793C10.4487 13.5114 10.4881 13.5509 10.5203 13.596C10.5566 13.6468 10.5801 13.7073 10.6271 13.8281Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
