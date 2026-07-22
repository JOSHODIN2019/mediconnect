import { useState, forwardRef } from 'react'

export const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon: LeadingIcon,
  trailingIcon: TrailingIcon,
  onTrailingIconClick,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  id,
  ...props
}, ref) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeadingIcon && (
          <div className="absolute left-3 text-neutral-400 pointer-events-none">
            <LeadingIcon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={[
            'w-full h-10 rounded-lg border text-sm text-neutral-900 bg-white',
            'placeholder:text-neutral-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
            LeadingIcon ? 'pl-9' : 'pl-3.5',
            isPassword || TrailingIcon ? 'pr-10' : 'pr-3.5',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
              : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-100',
          ].join(' ')}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {!isPassword && TrailingIcon && (
          <button
            type="button"
            tabIndex={-1}
            onClick={onTrailingIconClick}
            className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <TrailingIcon size={16} />
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <ErrorDot />
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-neutral-400">
          {hint}
        </p>
      )}
    </div>
  )
})

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ErrorDot() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="6" cy="6" r="6" />
      <path d="M6 3.5v3M6 8.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
