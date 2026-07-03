import { spotifyFetch } from '@/lib/spotify/fetch'
import { NextRequest, NextResponse } from 'next/server'


  export async function POST(request: NextRequest) {
    const { name = 'DnDJ Queue', description = 'Managed by DnDJ. Recreated on every deployment.', trackUris } = await request.json()
  
    // 1. create the playlist
    const res = await spotifyFetch('/v1/me/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, description, public: false }),
    })
    const playlist = await res.json()
  
    // 2. add tracks (max 100 per call Spotify limit)
    if (trackUris?.length) {
      await spotifyFetch(`/v1/playlists/${playlist.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ uris: trackUris.slice(0, 100) }),
      })
    }
  
    return NextResponse.json({ success: true, data: playlist })
  }
  