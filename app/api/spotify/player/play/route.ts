import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { uri } = await request.json()
    if (!uri) {
      return NextResponse.json({ error: 'uri required' }, { status: 400 })
    }

    await spotifyFetch('/v1/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] }),
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
