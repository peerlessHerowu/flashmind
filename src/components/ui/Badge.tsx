import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'new' | 'learning' | 'review' | 'due' | 'mastered' | 'suspended'

const styles: Record<BadgeVariant, string> = {
  default:   'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  new:       'bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-500',
  learning:  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  review:    'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  due:       'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  mastered:  'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  suspended: 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400',
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
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      styles[variant],
      className
    )}>
      {children ?? labels[variant]}
    </span>
  )
}
