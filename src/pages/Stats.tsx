import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Flame, BookOpen, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTodayReviewCount, useStreak, useDailyBars, useTotalCards } from '@/hooks/useStats'
import { useDecks, useDeckStats } from '@/hooks/useDeck'
import { ProgressBar } from '@/components/ui/ProgressBar'

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 rounded-2xl bg-white dark:bg-white dark:bg-ink-900 shadow-beautiful-md dark:shadow-card-dark p-4 flex flex-col gap-2"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </motion.div>
  )
}

function DeckStatRow({ deckId }: { deckId: string }) {
  const decks = useDecks() ?? []
  const deck  = decks.find(d => d.id === deckId)
  const stats = useDeckStats(deckId)
  if (!deck || !stats || stats.total === 0) return null
  const pct = Math.round((stats.mastered / stats.total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: deck.color }} />
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{deck.emoji} {deck.name}</span>
      <div className="flex items-center gap-2 w-28">
        <ProgressBar value={pct} className="flex-1" />
        <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
      </div>
    </div>
  )
}

export function Stats() {
  const todayCount = useTodayReviewCount() ?? 0
  const streak     = useStreak() ?? 0
  const totalCards = useTotalCards() ?? 0
  const bars       = useDailyBars(30) ?? []
  const decks      = useDecks() ?? []
  const maxBar     = Math.max(...bars.map(b => b.count), 1)

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="sticky top-0 z-20 px-5 pt-safe-top pb-3 pt-5 bg-gray-50/80 dark:bg-ink-950/80 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">学习统计</h1>
      </header>

      <main className="flex-1 px-5 pb-24 space-y-6 mt-3">
        {/* 核心数字卡片 */}
        <div className="flex gap-3">
          <StatCard icon={<Flame size={18} className="text-orange-500" />} label="连续天数" value={streak} color="bg-orange-50 dark:bg-orange-500/10" />
          <StatCard icon={<BookOpen size={18} className="text-blue-500" />} label="总卡片" value={totalCards} color="bg-blue-50 dark:bg-blue-500/10" />
          <StatCard icon={<CheckCircle size={18} className="text-green-500" />} label="今日复习" value={todayCount} color="bg-green-50 dark:bg-green-500/10" />
        </div>

        {/* 30天趋势 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">过去 30 天复习量</h2>
          <div className="rounded-2xl bg-white dark:bg-white dark:bg-ink-900 shadow-beautiful-md dark:shadow-card-dark p-4">
            {bars.every(b => b.count === 0) ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">还没有复习记录</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={bars} barCategoryGap="30%">
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1E1E2E', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                    formatter={(v: number) => [`${v} 张`, '复习']}
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bars.map((entry, i) => (
                      <Cell key={i} fill={entry.count > 0 ? '#6366F1' : '#E5E7EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* 各牌组掌握情况 */}
        {decks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">各牌组掌握情况</h2>
            <div className="rounded-2xl bg-white dark:bg-white dark:bg-ink-900 shadow-beautiful-md dark:shadow-card-dark p-4 space-y-4">
              {decks.map(deck => <DeckStatRow key={deck.id} deckId={deck.id} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
