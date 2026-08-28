import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDecks } from '@/hooks/useDeck'
import { useDueCount, useNewCount } from '@/hooks/useReviewQueue'
import { useTodayReviewCount, useStreak } from '@/hooks/useStats'
import { DeckCard } from '@/components/deck/DeckCard'
import { DeckFormModal } from '@/components/deck/DeckFormModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'

export function Home() {
  const navigate = useNavigate()
  const decks    = useDecks() ?? []
  const dueCount = useDueCount() ?? 0
  const newCount = useNewCount() ?? 0
  const todayDone = useTodayReviewCount() ?? 0
  const streak    = useStreak() ?? 0
  const total     = dueCount + newCount

  const [showCreate, setShowCreate] = useState(false)

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } }
  }
  const item = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.25 } }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-safe-top pb-3 pt-4 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FlashMind</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors"
            aria-label="新建牌组"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors"
            aria-label="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 space-y-6 mt-2">
        {/* 连续打卡 Banner */}
        {streak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 p-4 text-white"
          >
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-base">连续 {streak} 天</p>
              <p className="text-sm opacity-90">今日已完成 {todayDone} 张，继续保持！</p>
            </div>
          </motion.div>
        )}

        {/* 今日复习入口 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl p-5 space-y-4',
            total > 0
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
              : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/6'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-sm font-medium', total > 0 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')}>
                今日待复习
              </p>
              <p className={cn('text-4xl font-bold mt-0.5', total > 0 ? 'text-white' : 'text-gray-900 dark:text-white')}>
                {total}
                <span className={cn('text-lg font-normal ml-1', total > 0 ? 'text-white/70' : 'text-gray-400')}>张</span>
              </p>
            </div>
            <Zap
              size={36}
              className={total > 0 ? 'text-white/40' : 'text-primary-200 dark:text-primary-800'}
              strokeWidth={1.5}
            />
          </div>

          {total > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              {dueCount > 0 && <span>{dueCount} 复习</span>}
              {dueCount > 0 && newCount > 0 && <span>·</span>}
              {newCount > 0 && <span>{newCount} 新卡</span>}
            </div>
          )}

          <Button
            fullWidth
            variant={total > 0 ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => navigate('/review')}
            disabled={total === 0}
            className={total > 0 ? 'bg-white/20 hover:bg-white/30 text-white border-0' : ''}
          >
            {total > 0 ? '开始复习' : '今日已完成 ✓'}
          </Button>
        </motion.div>

        {/* 牌组列表 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">我的牌组</h2>
            {decks.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-primary-500 font-medium"
              >
                + 新建
              </button>
            )}
          </div>

          {decks.length === 0 ? (
            <EmptyState
              icon={<span className="text-2xl">📚</span>}
              title="还没有牌组"
              description="创建第一个牌组，开始你的记忆之旅"
              action={{ label: '创建牌组', onClick: () => setShowCreate(true) }}
            />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3"
            >
              {decks.map(deck => (
                <motion.div key={deck.id} variants={item}>
                  <DeckCard deck={deck} onClick={() => navigate(`/deck/${deck.id}`)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>

      <DeckFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
