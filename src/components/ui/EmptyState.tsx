import { Button } from './Button'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-400">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        {description && <p className="text-sm text-gray-500 dark:text-gray-500">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
