'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
  'streaming',
].join(' ')

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: SPOTIFY_SCOPES,
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">dndj</h1>

      {error && (
        <p className="text-sm text-red-500">{decodeURIComponent(error)}</p>
      )}

      <button
        onClick={handleLogin}
        className="bg-[#1DB954] hover:bg-[#1aa34a] text-white font-semibold px-8 py-3 rounded-full transition-colors"
      >
        Sign in with Spotify
      </button>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
