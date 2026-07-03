import type { Track } from '@/types/spotify'

export type DBTrack = {
  spotify_id: string
  name: string
  artist_names: string[]
  album_art_url: string | null
  duration_ms: number
  uri: string
}

export function dbToTrack(t: DBTrack): Track {
  return {
    id: t.spotify_id,
    name: t.name,
    artists: t.artist_names.map(name => ({ name })),
    album: { images: t.album_art_url ? [{ url: t.album_art_url }] : [] },
    duration_ms: t.duration_ms,
    uri: t.uri,
  }
}
