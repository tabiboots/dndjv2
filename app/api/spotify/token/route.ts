import { getSpotifyToken } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const accessToken = await getSpotifyToken()
    return NextResponse.json({ access_token: accessToken })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
