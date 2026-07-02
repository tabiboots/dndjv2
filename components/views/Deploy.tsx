import type { Track } from '@/types/spotify'
import SongChip from '@/components/ui/SongChip'

export default function DeployView({ currentTrack }: { currentTrack: Track | null }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center justify-start w-full border-r border-gray-300 h-full">
        <h1 className="text-2xl font-bold py-4">Deploy</h1>
        
      </div>

      <div className="flex flex-col items-center justify-start w-full border-l border-gray-300 h-full">
        <p className="text-2xl font-bold py-4">Queue</p>
      </div>
    </div>
  )
}
