import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TrackTagRow } from '@/lib/contexts/TagDataContext'
import type { DBTrack } from '@/lib/spotify/dbTrack'

const supabase = createClient()

type TrackTagsResult = {
  rows: TrackTagRow[]
  tracksById: Record<string, DBTrack>
}

export function useTrackTagsQuery(uid: string | null) {
  return useQuery({
    queryKey: ['track-tags', uid],
    queryFn: async (): Promise<TrackTagsResult> => {
      const { data } = await supabase
        .from('track_tags')
        .select('spotify_id, tag_id, tagged_at, tracks(spotify_id, name, artist_names, album_art_url, duration_ms, uri)')
        .eq('user_id', uid!)
        .order('tagged_at', { ascending: false })

      const rows: TrackTagRow[] = []
      const tracksById: Record<string, DBTrack> = {}
      for (const r of data ?? []) {
        rows.push({ spotify_id: r.spotify_id, tag_id: r.tag_id, tagged_at: r.tagged_at })
        const track = r.tracks as unknown as DBTrack | null
        if (track) tracksById[track.spotify_id] = track
      }
      return { rows, tracksById }
    },
    enabled: !!uid,
  })
}
