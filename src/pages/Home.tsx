import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDecks } from '@/hooks/useDeck'
import { useDueCount, useNewCount } from '@/hooks/useReviewQueue'
import { useTodayReviewCount, useStreak } from '@/hooks/useStats'
import { DeckCard } from '@/components/deck/DeckCard'
import { DeckFormModal } from '@/components/deck/DeckFormModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
}

export function Home() {
  const navigate   = useNavigate()
  const decks      = useDecks() ?? []
  const dueCount   = useDueCount() ?? 0
  const newCount   = useNewCount() ?? 0
  const todayDone  = useTodayReviewCount() ?? 0
  const streak     = useStreak() ?? 0
  const total      = dueCount + newCount
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-ink-950">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-safe-top pb-3 bg-paper-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-paper-200/60 dark:border-ink-800/60">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[17px] font-bold text-paper-900 dark:text-white tracking-tight">FlashMind</h1>
          {streak >= 2 && (
            <span className="text-xs text-primary-500 font-semibold tabular-nums">🔥{streak}</span>
          )}
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-lg text-paper-500 dark:text-ink-400 hover:bg-paper-200 dark:hover:bg-ink-800 transition-colors"
            aria-label="新建牌组"
          >
            <Plus size={19} strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg text-paper-500 dark:text-ink-400 hover:bg-paper-200 dark:hover:bg-ink-800 transition-colors"
            aria-label="设置"
          >
            <Settings size={18} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-5 mt-4">

        {/* 今日复习卡 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className={cn(
            'rounded-xl p-5',
            total > 0
              ? 'bg-ink-950 dark:bg-ink-900 border border-ink-700/60'
              : 'bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700/60'
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={cn(
                'text-[11px] font-semibold uppercase tracking-widest mb-1',
                total > 0 ? 'text-ink-500' : 'text-paper-500 dark:text-ink-500'
              )}>
                今日待复习
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn(
                  'text-5xl font-bold tabular-nums leading-none',
                  total > 0 ? 'text-primary-400' : 'text-paper-300 dark:text-ink-700'
                )}>
                  {total}
                </span>
                <span className={cn(
                  'text-base font-normal',
                  total > 0 ? 'text-ink-500' : 'text-paper-400 dark:text-ink-600'
                )}>张</span>
              </div>
            </div>

            {/* 状态分解 */}
            {total > 0 && (
              <div className="text-right space-y-1 mt-1">
                {dueCount > 0 && (
                  <p className="text-[11px] text-ink-400 tabular-nums">
                    <span className="text-red-400 font-semibold">{dueCount}</span> 到期
                  </p>
                )}
                {newCount > 0 && (
                  <p className="text-[11px] text-ink-400 tabular-nums">
                    <span className="text-primary-400 font-semibold">{newCount}</span> 新卡
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            fullWidth size="lg"
            onClick={() => navigate('/review')}
            disabled={total === 0}
            className={total > 0
              ? 'bg-primary-500 text-ink-950 hover:bg-primary-400 font-bold text-[15px] rounded-xl shadow-glow'
              : 'bg-paper-100 dark:bg-ink-800 text-paper-400 dark:text-ink-500 cursor-default rounded-xl border-0'
            }
          >
            {total > 0 ? '开始复习' : '今日已完成 ✓'}
          </Button>

          {todayDone > 0 && (
            <p className="text-center text-[11px] text-ink-500 mt-2.5 tabular-nums">
              今日已复习 {todayDone} 张
            </p>
          )}
        </motion.div>

        {/* 牌组列表 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold text-paper-500 dark:text-ink-500 uppercase tracking-widest">
              我的牌组
            </h2>
            {decks.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-[12px] text-primary-500 font-semibold hover:text-primary-400 transition-colors"
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
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2.5"
            >
              {decks.map(deck => (
                <motion.div key={deck.id} variants={fadeUp}>
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
