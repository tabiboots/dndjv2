import type { Track } from './SongChip'
import IconButton from './IconButton'

export default function TagPanel({ track, onClose }: { track: Track; onClose: () => void }) {
  const art = track.album.images[0]?.url

  return (
    <div style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }} className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center justify-between">
        <IconButton onClick={onClose} className="w-7 h-7 text-sm">×</IconButton>
      </div>

      <div className="flex flex-col gap-1 items-center">
        {art && <img src={art} alt="" className="w-40 aspect-square object-cover rounded-lg shadow-xl border-2 border-gray-200" />}
        <p className="text-medium pt-2 font-medium text-black truncate">{track.name}</p>
        <p className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      <div className="mt-auto pb-4">
        <form className="flex flex-row items-center justify-around">
          <input type="text" placeholder="Create a new tag..." className="w-5/6 px-3 py-3 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-sm outline-none text-black placeholder:text-gray-400" />
          <IconButton type="submit" className="w-12 h-12" onClick={e => e.preventDefault()}>
            <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg></IconButton>
        </form>
      </div>
    </div>
  )
}
