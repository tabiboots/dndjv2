const PALETTE = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#a855f7', '#0ea5e9', '#84cc16']

function tagColor(id: string) {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTE[n % PALETTE.length]
}

export default function TagChip({ id, name, active }: { id: string; name: string; active?: boolean }) {
  const color = tagColor(id)
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 pr-3 rounded-full bg-gray-100 border border-gray-300 shadow-inner text-xl leading-none text-gray-700 whitespace-nowrap">
      <span
        className="w-2 h-2 mr-1 rounded-full shrink-0 transition-all duration-100 ease-in"
        style={active ? { background: color, boxShadow: `0 0 5px 2px ${color}88` } : { background: '#d1d5db' }}
      />
      {name.toLowerCase()}
    </span>
  )
}
