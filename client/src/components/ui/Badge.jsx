const variants = {
  primary: 'bg-blue-50 text-blue-700 border-blue-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger:  'bg-red-50 text-red-700 border-red-100',
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  info:    'bg-sky-50 text-sky-700 border-sky-100',
  purple:  'bg-purple-50 text-purple-700 border-purple-100',
}

const dotColors = {
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  neutral: 'bg-neutral-400',
  info:    'bg-sky-500',
  purple:  'bg-purple-500',
}

const sizes = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  className = '',
}) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full border',
        variants[variant] ?? variants.neutral,
        sizes[size] ?? sizes.md,
        className,
      ].join(' ')}
    >
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant] ?? dotColors.neutral}`} />
      )}
      {children}
    </span>
  )
}

export function RoleBadge({ role }) {
  const map = {
    admin:   { label: 'Admin',   variant: 'purple' },
    doctor:  { label: 'Doctor',  variant: 'primary' },
    patient: { label: 'Patient', variant: 'success' },
  }
  const { label, variant } = map[role?.toLowerCase()] ?? { label: role, variant: 'neutral' }
  return <Badge variant={variant} withDot>{label}</Badge>
}

export function StatusBadge({ status }) {
  const map = {
    active:   { label: 'Active',   variant: 'success' },
    inactive: { label: 'Inactive', variant: 'neutral' },
    pending:  { label: 'Pending',  variant: 'warning' },
    revoked:  { label: 'Revoked',  variant: 'danger'  },
    verified: { label: 'Verified', variant: 'primary' },
    tampered: { label: 'Tampered', variant: 'danger'  },
  }
  const { label, variant } = map[status?.toLowerCase()] ?? { label: status, variant: 'neutral' }
  return <Badge variant={variant} withDot>{label}</Badge>
}
