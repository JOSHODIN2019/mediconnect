import { useEffect, useRef } from 'react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({ isOpen, onClose, children, size = 'md', className = '' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={[
          'relative w-full bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgb(0,0,0,0.1),0_8px_10px_-6px_rgb(0,0,0,0.06)]',
          'animate-[fadeInScale_0.18s_ease-out]',
          sizes[size] ?? sizes.md,
          className,
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-neutral-100">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L8 5.586l2.293-2.293a1 1 0 011.414 1.414L9.414 7l2.293 2.293a1 1 0 01-1.414 1.414L8 8.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 7 4.293 4.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-neutral-50 border-t border-neutral-100 rounded-b-2xl flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}
