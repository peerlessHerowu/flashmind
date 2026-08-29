import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-primary-500 text-ink-950 font-semibold hover:bg-primary-400 active:bg-primary-600 shadow-sm',
  secondary: 'bg-paper-100 text-paper-900 hover:bg-paper-200 active:bg-paper-300 dark:bg-ink-800 dark:text-white dark:hover:bg-ink-700 border border-paper-300 dark:border-ink-700',
  ghost:     'bg-transparent text-paper-700 hover:bg-paper-100 active:bg-paper-200 dark:text-ink-300 dark:hover:bg-ink-800',
  danger:    'bg-red-500/10 text-red-600 hover:bg-red-500/20 active:bg-red-500/30 dark:text-red-400 border border-red-500/20',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px] rounded-md gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-5 py-3 text-[15px] rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center font-medium select-none',
      'transition-all duration-100',
      'active:scale-[0.97]',
      'disabled:cursor-not-allowed disabled:opacity-40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-1',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {loading && (
      <svg className="h-4 w-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    )}
    {children}
  </button>
))
Button.displayName = 'Button'
