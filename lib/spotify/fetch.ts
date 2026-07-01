import { createClient } from '@/lib/supabase/server'
import { SpotifyError } from '@/types/spotify'

export async function getSpotifyToken(): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new SpotifyError('No authenticated user', 401, 'unauthenticated')
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .single()

  if (tokenError || !tokenRow) {
    throw new SpotifyError('No Spotify tokens found', 401, 'unauthenticated')
  }

  if (new Date(tokenRow.expires_at) > new Date()) {
    return tokenRow.access_token
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenRow.refresh_token,
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.json().catch(() => ({}))
    if (body.error === 'invalid_grant') {
      await supabase.from('spotify_tokens').delete().eq('user_id', user.id)
    }
    throw new SpotifyError('Spotify token refresh failed', 401, 'unauthenticated')
  }

  const { access_token, expires_in, refresh_token } = await tokenRes.json()

  await supabase.from('spotify_tokens').update({
    access_token,
    refresh_token: refresh_token ?? tokenRow.refresh_token,
    expires_at:    new Date(Date.now() + expires_in * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  }).eq('user_id', user.id)

  return access_token
}

export async function spotifyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getSpotifyToken()

  let res: Response
  try {
    res = await fetch(`https://api.spotify.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
    })
  } catch {
    throw new SpotifyError('Network error reaching Spotify', 502, 'network_error')
  }

  if (res.status === 401) {
    throw new SpotifyError('Spotify token invalid', 401, 'unauthenticated')
  }

  if (res.status === 403) {
    throw new SpotifyError('Missing Spotify scope', 403, 'forbidden')
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') ?? 1)
    throw new SpotifyError('Spotify rate limit hit', 429, 'rate_limited', retryAfter)
  }

  if (!res.ok) {
    throw new SpotifyError(`Spotify error ${res.status}`, res.status, 'spotify_error')
  }

  return res
}
