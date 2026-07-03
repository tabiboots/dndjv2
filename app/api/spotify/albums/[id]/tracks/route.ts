import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await spotifyFetch(`/v1/albums/${encodeURIComponent(id)}/tracks?limit=50`)
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ success: false, error: 'internal server error' }, { status: 500 })
  }
}
