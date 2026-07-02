import type { Track } from './SongChip'

export default function TagPanel({ track, onClose }: { track: Track; onClose: () => void }) {
  const art = track.album.images[0]?.url

  return (
    <div style={{ animation: 'fadeIn 0.15s ease 0.3s forwards', opacity: 0 }} className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 border border-gray-300 shadow-md text-gray-400 hover:text-black transition-all active:shadow-inner active:bg-gray-200 text-sm"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-2 items-center">
        {art && <img src={art} alt="" className="w-40 aspect-square object-cover rounded-lg shadow-xl border-3 border-gray-200" />}
        <p className="text-sm font-medium text-black truncate">{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      <div className="mt-auto pb-4">
        <form className="flex flex-row items-center justify-around">
          <input type="text" placeholder="Create a new tag..." className="w-5/6 px-3 py-3 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-sm outline-none text-black placeholder:text-gray-400" />
          <button type="submit" className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 shadow-md text-gray-500 hover:text-black transition-all active:shadow-inner active:scale-[0.97] active:bg-gray-200" onClick={e => e.preventDefault()}>+</button>
        </form>
      </div>
    </div>
  )
}
