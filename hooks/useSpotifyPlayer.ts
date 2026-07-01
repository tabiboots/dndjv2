'use client'

import { useEffect, useRef, useState } from 'react'

export interface SpotifyPlayerState {
  player: Spotify.Player | null
  deviceId: string | null
  isReady: boolean
  playbackState: Spotify.PlaybackState | null
}

export function useSpotifyPlayer(): SpotifyPlayerState {
  const [isReady, setIsReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)

  useEffect(() => {
    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: 'dndj',
        getOAuthToken: async (cb) => {
          const res = await fetch('/api/spotify/token')
          const data = await res.json()
          cb(data.access_token)
        },
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setIsReady(true)
      })

      player.addListener('not_ready', () => {
        setIsReady(false)
      })

      player.addListener('player_state_changed', (state) => {
        setPlaybackState(state)
      })

      player.connect()
      playerRef.current = player
    }

    // SDK may already be loaded (e.g. during HMR in dev)
    if (window.Spotify) {
      initPlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer

      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [])

  return { player: playerRef.current, deviceId, isReady, playbackState }
}
