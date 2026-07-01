import { spotifyFetch } from '@/lib/spotify/fetch'
import { SpotifyError } from '@/types/spotify'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const searchSchema = z.object({
  q:      z.string().min(1),
  type:   z.string().default('track'),
  limit:  z.coerce.number().int().min(1).max(10).default(10),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = searchSchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { q, type, limit, offset } = parsed.data

  try {
    const qs = new URLSearchParams({ q, type, limit: String(limit), offset: String(offset) })
    const res = await spotifyFetch(`/v1/search?${qs}`)
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
