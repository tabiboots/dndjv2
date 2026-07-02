'use client'

import { useEffect, useRef, useState } from 'react'
import IconButton from '@/components/ui/IconButton'

interface Props {
  player: Spotify.Player | null
  playbackState: Spotify.PlaybackState | null
}

export default function PlayerControls({ player, playbackState }: Props) {
  const isPaused = playbackState?.paused ?? true
  const position = playbackState?.position ?? 0
  const duration = playbackState?.duration ?? 1

  const [displayProgress, setDisplayProgress] = useState(0)
  const progressRef = useRef({ pct: 0, duration: 1, playing: false })

  useEffect(() => {
    if (!playbackState) { progressRef.current.pct = 0; setDisplayProgress(0); return }
    const pct = (position / duration) * 100
    progressRef.current.pct = pct
    progressRef.current.duration = duration
    progressRef.current.playing = !isPaused
    setDisplayProgress(pct)
  }, [playbackState])

  useEffect(() => {
    const id = setInterval(() => {
      if (!progressRef.current.playing) return
      progressRef.current.pct = Math.min(100, progressRef.current.pct + (500 / progressRef.current.duration) * 100)
      setDisplayProgress(progressRef.current.pct)
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="flex items-center gap-2">
        <IconButton onClick={() => player?.previousTrack()} className="w-9 h-9" aria-label="Previous">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 19V5M16.4005 6.07961L10.5617 10.7506C10.0279 11.1777 9.76097 11.3912 9.66433 11.6492C9.5796 11.8754 9.5796 12.1246 9.66433 12.3508C9.76097 12.6088 10.0279 12.8223 10.5617 13.2494L16.4005 17.9204C17.2327 18.5861 17.6487 18.919 17.9989 18.9194C18.3035 18.9197 18.5916 18.7812 18.7815 18.5432C19 18.2695 19 17.7367 19 16.671V7.329C19 6.2633 19 5.73045 18.7815 5.45677C18.5916 5.21876 18.3035 5.0803 17.9989 5.08063C17.6487 5.081 17.2327 5.41387 16.4005 6.07961Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>

        <IconButton onClick={() => player?.togglePlay()} className="w-9 h-9" aria-label={isPaused ? 'Play' : 'Pause'}>
          {isPaused ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'translateX(1px)' }}>
              <path d="M5 4.98951C5 4.01835 5 3.53277 5.20249 3.2651C5.37889 3.03191 5.64852 2.88761 5.9404 2.87018C6.27544 2.85017 6.67946 3.11953 7.48752 3.65823L18.0031 10.6686C18.6708 11.1137 19.0046 11.3363 19.1209 11.6168C19.2227 11.8621 19.2227 12.1377 19.1209 12.383C19.0046 12.6635 18.6708 12.886 18.0031 13.3312L7.48752 20.3415C6.67946 20.8802 6.27544 21.1496 5.9404 21.1296C5.64852 21.1122 5.37889 20.9679 5.20249 20.7347C5 20.467 5 19.9814 5 19.0103V4.98951Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 20V4M16 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </IconButton>

        <IconButton onClick={() => player?.nextTrack()} className="w-9 h-9" aria-label="Next">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 5V19M7.59951 17.9204L13.4383 13.2494C13.9721 12.8223 14.239 12.6088 14.3357 12.3508C14.4204 12.1246 14.4204 11.8754 14.3357 11.6492C14.239 11.3912 13.9721 11.1777 13.4383 10.7506L7.59951 6.07961C6.76734 5.41387 6.35125 5.081 6.00108 5.08063C5.69654 5.0803 5.40845 5.21876 5.21846 5.45677C5 5.73045 5 6.2633 5 7.329V16.671C5 17.7367 5 18.2695 5.21846 18.5432C5.40845 18.7812 5.69654 18.9197 6.00108 18.9194C6.35125 18.919 6.76734 18.5861 7.59951 17.9204Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>
      </div>

      <div className="w-48 h-1 bg-gray-200 rounded-full border border-gray-200 shadow-inner overflow-hidden">
        <div
          className="h-full bg-gray-400 rounded-full"
          style={{ width: `${displayProgress}%`, transition: 'width 0.5s linear' }}
        />
      </div>
    </div>
  )
}
