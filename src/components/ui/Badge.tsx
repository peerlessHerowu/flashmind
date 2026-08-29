import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'new' | 'learning' | 'review' | 'due' | 'mastered' | 'suspended'

const styles: Record<BadgeVariant, string> = {
  default:   'bg-paper-100 text-paper-600 dark:bg-ink-800 dark:text-ink-400',
  new:       'bg-paper-100 text-paper-500 dark:bg-ink-800 dark:text-ink-500',
  learning:  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  review:    'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400',
  due:       'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  mastered:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  suspended: 'bg-paper-100 text-paper-500 dark:bg-ink-800 dark:text-ink-400',
}

const labels: Record<BadgeVariant, string> = {
  default:   '',
  new:       '新',
  learning:  '学习中',
  review:    '复习',
  due:       '到期',
  mastered:  '已掌握',
  suspended: '暂停',
}

interface BadgeProps {
  variant?: BadgeVariant
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium',
      styles[variant],
      className
    )}>
      {children ?? labels[variant]}
    </span>
  )
}
