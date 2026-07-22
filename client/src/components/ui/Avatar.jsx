const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const colors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
]

function getColorFromName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

export function Avatar({ name, src, size = 'md', className = '' }) {
  const colorClass = getColorFromName(name)
  const initials = getInitials(name)

  return (
    <div
      aria-label={name}
      className={[
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none overflow-hidden',
        sizes[size] ?? sizes.md,
        !src ? colorClass : '',
        className,
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials || '?'
      )}
    </div>
  )
}
