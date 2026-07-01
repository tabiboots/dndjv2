'use client'

import { useEffect, useRef, useState } from 'react'

export function useSpotifyPlayer() {
  const [isReady, setIsReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)

  useEffect(() => {
    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: 'dndj',
        getOAuthToken: async (cb) => {
          const res = await fetch('/api/spotify/token')
          if (!res.ok) { window.location.href = '/login'; return }
          const { access_token } = await res.json()
          cb(access_token)
        },
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setIsReady(true)
        setError(null)
      })

      player.addListener('not_ready', () => {
        setIsReady(false)
      })

      player.addListener('player_state_changed', (state) => {
        setPlaybackState(state)
      })

      player.addListener('initialization_error', ({ message }) => {
        setError(`Player failed to initialize: ${message}`)
      })

      player.addListener('authentication_error', ({ message }) => {
        setError(`Authentication failed: ${message}`)
        window.location.href = '/login'
      })

      player.addListener('account_error', ({ message }) => {
        setError(`Spotify Premium required: ${message}`)
      })

      player.addListener('playback_error', ({ message }) => {
        setError(`Playback error: ${message}`)
      })

      player.addListener('autoplay_failed', () => {
        setError('Autoplay blocked — click play to start')
      })

      player.connect().then(ok => {
        if (!ok) setError('Failed to connect to Spotify')
      })
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

  return { player: playerRef.current, deviceId, isReady, playbackState, error }
}
