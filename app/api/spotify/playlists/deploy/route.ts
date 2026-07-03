import { createClient } from '@/lib/supabase/server'
import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextRequest, NextResponse } from 'next/server'

const PLAYLIST_NAME = 'DnDJ Queue'
const BATCH = 100

export async function POST(request: NextRequest) {
  try {
    const { uris, play = true } = await request.json()
    if (!Array.isArray(uris) || uris.length === 0) {
      return NextResponse.json({ error: 'uris required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const { data: row } = await supabase
      .from('deploy_playlists')
      .select('playlist_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // reuse the stored playlist unless the user deleted it on Spotify
    let playlistId: string | null = row?.playlist_id ?? null
    if (playlistId) {
      try {
        await spotifyFetch(`/v1/playlists/${playlistId}?fields=id`)
      } catch (err) {
        if (err instanceof SpotifyError && err.status === 404) playlistId = null
        else throw err
      }
    }

    if (!playlistId) {
      const res = await spotifyFetch('/v1/me/playlists', {
        method: 'POST',
        body: JSON.stringify({
          name: PLAYLIST_NAME,
          description: 'Managed by DnDJ. Contents replaced on every deploy.',
          public: false,
        }),
      })
      playlistId = (await res.json()).id as string
      await supabase
        .from('deploy_playlists')
        .upsert({ user_id: user.id, playlist_id: playlistId }, { onConflict: 'user_id' })
    }

    // PUT replaces the first 100; POST appends the rest in 100-track batches
    await spotifyFetch(`/v1/playlists/${playlistId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ uris: uris.slice(0, BATCH) }),
    })
    for (let i = BATCH; i < uris.length; i += BATCH) {
      await spotifyFetch(`/v1/playlists/${playlistId}/items`, {
        method: 'POST',
        body: JSON.stringify({ uris: uris.slice(i, i + BATCH) }),
      })
    }

    // playback failure (e.g. no active device) shouldn't fail the deploy
    let played = false
    let playError: string | null = null
    if (play) {
      try {
        await spotifyFetch('/v1/me/player/play', {
          method: 'PUT',
          body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`,
            offset: { position: 0 },
          }),
        })
        played = true
      } catch (err) {
        playError = err instanceof SpotifyError ? err.message : 'Playback failed'
      }
    }

    return NextResponse.json({
      playlistId,
      url: `https://open.spotify.com/playlist/${playlistId}`,
      total: uris.length,
      played,
      playError,
    })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
