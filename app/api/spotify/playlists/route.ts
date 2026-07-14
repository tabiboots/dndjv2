import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse, type NextRequest } from 'next/server'

// keep in sync with PLAYLIST_NAME in playlists/deploy/route.ts (route files can't export extra consts)
const DEPLOY_PLAYLIST_NAME = 'dndj queue'

type PlaylistItem = { name?: string; owner?: { id?: string } }

export async function GET(request: NextRequest) {
  const offset = Math.max(0, parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10) || 0)
  try {
    const [me, data] = await Promise.all([
      spotifyFetch('/v1/me').then(r => r.json()),
      spotifyFetch(`/v1/me/playlists?limit=50&offset=${offset}`).then(r => r.json()),
    ])

    // hide followed playlists (their items aren't ours to see) and the app-managed deploy queue
    const owned = (data.items ?? []).filter(
      (p: PlaylistItem) => p?.owner?.id === me.id && p?.name?.toLowerCase() !== DEPLOY_PLAYLIST_NAME
    )
    return NextResponse.json({
      success: true,
      // nextOffset advances by the raw page size, not owned.length: filtering shrinks pages
      data: { items: owned, next: data.next != null, nextOffset: offset + (data.items?.length ?? 0) },
    })
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