const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

const colors = {
  white: 'border-white/30 border-t-white',
  dark:  'border-neutral-300 border-t-neutral-700',
  blue:  'border-blue-200 border-t-blue-600',
}

export function Spinner({ size = 'md', color = 'blue', className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={[
        'rounded-full border-2 animate-spin flex-shrink-0',
        sizes[size] ?? sizes.md,
        colors[color] ?? colors.blue,
        className,
      ].join(' ')}
    />
  )
}
