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
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center px-4', className)}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-paper-100 dark:bg-ink-800 text-paper-400 dark:text-ink-500">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-paper-800 dark:text-white">{title}</p>
        {description && <p className="text-sm text-paper-500 dark:text-ink-400 leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" onClick={action.onClick} size="sm" className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}
