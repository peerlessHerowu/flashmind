import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number   // 0-100
  className?: string
  color?: string
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, className, color = 'bg-primary-500', size = 'sm' }: ProgressBarProps) {
  const h = size === 'sm' ? 'h-1' : 'h-1.5'
  return (
    <div className={cn('w-full rounded-full bg-paper-200 dark:bg-ink-700 overflow-hidden', h, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
