export default function MediaChip({ name, imageUrl, subtitle, onClick }: {
  name: string
  imageUrl?: string
  subtitle?: string
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-start gap-1 shrink-0 w-40 text-left">
      <div className="w-40 h-40 rounded-lg bg-gray-200 border border-gray-300 shadow-md overflow-hidden">
        {imageUrl && <img src={imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <p className="text-xs font-medium text-black truncate w-full">{name}</p>
      {subtitle && <p className="text-xs text-gray-400 truncate w-full">{subtitle}</p>}
    </button>
  )
}
