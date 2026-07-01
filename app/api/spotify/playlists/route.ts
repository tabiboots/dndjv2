import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  userId: z.string().min(1).optional(),
})

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { userId } = parsed.data
  const endpoint = userId
    ? `/v1/users/${encodeURIComponent(userId)}/playlists?limit=20`
    : '/v1/me/playlists?limit=20'

  try {
    const res = await spotifyFetch(endpoint)
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
