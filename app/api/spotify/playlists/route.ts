import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse } from 'next/server'

// keep in sync with PLAYLIST_NAME in playlists/deploy/route.ts (route files can't export extra consts)
const DEPLOY_PLAYLIST_NAME = 'dndj queue'

export async function GET() {
  try {
    const [meRes, listRes] = await Promise.all([
      spotifyFetch('/v1/me'),
      spotifyFetch('/v1/me/playlists?limit=20'),
    ])
    const me = await meRes.json()
    const data = await listRes.json()
    // hide followed playlists (their items aren't ours to see) and the app-managed deploy queue
    data.items = (data.items ?? []).filter(
      (p: { name?: string; owner?: { id?: string } }) =>
        p?.owner?.id === me.id && p?.name?.toLowerCase() !== DEPLOY_PLAYLIST_NAME
    )
    return NextResponse.json({ success: true, data })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      )
    }
    return NextResponse.json({ success: false, error: 'internal server error' }, { status: 500 })
  }
}