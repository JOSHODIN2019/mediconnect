const variants = {
  default:  'bg-white border border-neutral-200 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]',
  elevated: 'bg-white border border-neutral-100 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.07),0_2px_4px_-2px_rgb(0,0,0,0.05)]',
  flat:     'bg-neutral-50 border border-neutral-200',
  outline:  'bg-white border border-neutral-300',
}

export function Card({ children, variant = 'default', className = '', ...props }) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-neutral-100 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {title && <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>}
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '', padded = true }) {
  return (
    <div className={`${padded ? 'px-6 py-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-neutral-50 border-t border-neutral-100 ${className}`}>
      {children}
    </div>
  )
}
