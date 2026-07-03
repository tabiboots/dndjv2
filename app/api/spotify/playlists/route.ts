import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await spotifyFetch('/v1/me/playlists?limit=20')
    const data = await res.json()
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
