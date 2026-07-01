import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  const { session } = data
  if (!session?.provider_token || !session?.provider_refresh_token) {
    return NextResponse.redirect(`${origin}/login?error=missing_spotify_tokens`)
  }

  const { error: upsertError } = await supabase.from('spotify_tokens').upsert({
    user_id:       session.user.id,
    access_token:  session.provider_token,
    refresh_token: session.provider_refresh_token,
    expires_at:    new Date(Date.now() + 3600 * 1000).toISOString(),
    updated_at:    new Date().toISOString(),
  })

  if (upsertError) {
    return NextResponse.redirect(`${origin}/login?error=token_store_failed`)
  }

  return NextResponse.redirect(`${origin}/`)
}
