import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { uri, uris, offset } = await request.json()

    const list: string[] = Array.isArray(uris) && uris.length ? uris : uri ? [uri] : []
    if (!list.length || !list.every(u => typeof u === 'string')) {
      return NextResponse.json({ error: 'uri or uris required' }, { status: 400 })
    }

    const position =
      typeof offset === 'number' && offset >= 0 && offset < list.length ? offset : 0

    await spotifyFetch('/v1/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({ uris: list, offset: { position } }),
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
