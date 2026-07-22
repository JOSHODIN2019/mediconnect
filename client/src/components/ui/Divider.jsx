export function Divider({ label, className = '' }) {
  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400 font-medium">{label}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
    )
  }
  return <hr className={`border-0 border-t border-neutral-200 ${className}`} />
}
