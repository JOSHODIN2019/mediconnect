import { Spinner } from './Spinner'

const variants = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  warning:   'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
  outline:   'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 bg-white',
  ghost:     'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  'outline-primary': 'border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 bg-white',
}

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-sm gap-2',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
  xl: 'h-12 px-6 text-base gap-2.5',
}

const iconSizes = { xs: 12, sm: 14, md: 15, lg: 16, xl: 18 }

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-150 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'select-none cursor-pointer',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && <Spinner size="sm" color={variant === 'secondary' || variant === 'outline' || variant === 'ghost' ? 'dark' : 'white'} />}
      {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
    </button>
  )
}
