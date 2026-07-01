import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse } from 'next/server'

export async function PUT() {
  try {
    await spotifyFetch('/v1/me/player/pause', { method: 'PUT' })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
