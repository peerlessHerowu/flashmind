import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number   // 0-100
  className?: string
  color?: string  // tailwind bg class
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, className, color = 'bg-primary-500', size = 'sm' }: ProgressBarProps) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2'
  return (
    <div className={cn('w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden', h, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
