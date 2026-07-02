export interface Track {
  id: string | null
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
  duration_ms: number
  uri: string
}

export interface Album {
  id: string
  name: string
  artists: { name: string }[]
  images: { url: string }[]
  total_tracks: number
  uri: string
}

export interface Playlist {
  id: string
  name: string
  images: { url: string }[]
  uri: string
}

export class SpotifyError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: 'unauthenticated' | 'forbidden' | 'rate_limited' | 'spotify_error' | 'network_error',
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'SpotifyError'
  }
}
