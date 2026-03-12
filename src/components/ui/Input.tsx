import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, onRightIconClick, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[var(--text-primary)] select-none">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'input-base',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error ? 'error' : '',
              className,
            ].filter(Boolean).join(' ')}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              tabIndex={-1}
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-100 text-rose-500 text-[9px] font-bold flex items-center justify-center shrink-0">!</span>
            {error}
          </p>
        )}
        {!error && hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
