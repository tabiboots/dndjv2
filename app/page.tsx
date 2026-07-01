import { SpotifyPlayer } from '@/components/SpotifyPlayer'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">dndj</h1>
      <SpotifyPlayer />
    </main>
  )
}
