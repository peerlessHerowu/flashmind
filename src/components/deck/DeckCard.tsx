import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { Deck } from '@/types'
import { useDeckStats } from '@/hooks/useDeck'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface DeckCardProps {
  deck: Deck
  onClick: () => void
}

export function DeckCard({ deck, onClick }: DeckCardProps) {
  const stats = useDeckStats(deck.id)
  const masteredPct = stats && stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100) : 0
  const hasDue = (stats?.due ?? 0) > 0

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'relative w-full text-left rounded-2xl overflow-hidden',
        'bg-white dark:bg-gray-900',
        'shadow-card dark:shadow-none dark:border dark:border-white/6',
        'transition-shadow duration-200 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
      )}
    >
      {/* 顶部色条 */}
      <div className="h-2 w-full" style={{ backgroundColor: deck.color }} />

      <div className="p-4 space-y-3">
        {/* emoji + 名称 */}
        <div className="flex items-start gap-2">
          {deck.emoji && <span className="text-xl leading-none mt-0.5">{deck.emoji}</span>}
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">
            {deck.name}
          </span>
        </div>

        {/* 统计行 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {stats?.total ?? 0} 张
          </span>
          {hasDue && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {stats!.due} 到期
            </span>
          )}
        </div>

        {/* 掌握进度 */}
        {stats && stats.total > 0 && (
          <div className="space-y-1">
            <ProgressBar value={masteredPct} />
            <span className="text-[11px] text-gray-400">{masteredPct}% 已掌握</span>
          </div>
        )}
      </div>
    </motion.button>
  )
}
