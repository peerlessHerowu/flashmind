import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { Deck } from '@/types'
import { useDeckStats } from '@/hooks/useDeck'

interface DeckCardProps {
  deck: Deck
  onClick: () => void
}

export function DeckCard({ deck, onClick }: DeckCardProps) {
  const stats = useDeckStats(deck.id)
  const masteredPct = stats && stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100) : 0
  const hasDue = (stats?.due ?? 0) > 0
  const total  = stats?.total ?? 0

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative w-full text-left overflow-hidden rounded-xl',
        'bg-white dark:bg-ink-900',
        'shadow-beautiful-md dark:shadow-card-dark',
        'transition-shadow duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40'
      )}
    >
      {/* 左侧彩色竖条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: deck.color }}
      />

      <div className="pl-5 pr-4 py-4 space-y-2.5">
        {/* emoji + 名称 */}
        <div className="flex items-start gap-2">
          {deck.emoji && (
            <span className="text-lg leading-none mt-0.5 shrink-0">{deck.emoji}</span>
          )}
          <span className="text-[13px] font-semibold text-paper-900 dark:text-white leading-snug line-clamp-2 tracking-tight">
            {deck.name}
          </span>
        </div>

        {/* 底部统计行 */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-paper-500 dark:text-ink-500 tabular-nums">
            {total} 张
            {total > 0 && masteredPct > 0 && (
              <span className="ml-1 text-primary-500">· {masteredPct}%</span>
            )}
          </span>
          {hasDue && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-red-500 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse-dot" />
              {stats!.due}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
