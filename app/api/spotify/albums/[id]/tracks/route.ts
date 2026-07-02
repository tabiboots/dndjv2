import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().min(1) })

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = paramsSchema.safeParse(await params)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const res = await spotifyFetch(`/v1/albums/${encodeURIComponent(parsed.data.id)}/tracks?limit=50`)
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    if (err instanceof SpotifyError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ success: false, error: 'internal server error' }, { status: 500 })
  }
}
