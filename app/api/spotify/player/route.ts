import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await spotifyFetch('/v1/me/player')

    if (res.status === 204) {
      return NextResponse.json({ is_playing: false, item: null })
    }

    return NextResponse.json(await res.json())
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { device_id } = await request.json()
    if (!device_id) {
      return NextResponse.json({ error: 'device_id required' }, { status: 400 })
    }

    await spotifyFetch('/v1/me/player', {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [device_id], play: true }),
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
