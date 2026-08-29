import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Search, MoreVertical, Trash2, Archive, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeck, useDeckStats, deleteDeck, updateDeck } from '@/hooks/useDeck'
import { useCards, deleteCard, bulkImportCards } from '@/hooks/useCard'
import { useDueCount } from '@/hooks/useReviewQueue'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CardState } from '@/types'
import type { Card } from '@/types'
import { cn } from '@/utils/cn'
import { parseCSV } from '@/utils/import'
import toast from 'react-hot-toast'

function cardBadgeVariant(card: Card): 'new' | 'learning' | 'due' | 'mastered' | 'suspended' | 'review' {
  if (card.is_suspended) return 'suspended'
  if (card.state === CardState.New) return 'new'
  if (card.state === CardState.Learning || card.state === CardState.Relearning) return 'learning'
  if (card.scheduled_days >= 21) return 'mastered'
  if (card.due <= Date.now()) return 'due'
  return 'review'
}

export function DeckDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const deck      = useDeck(id!)
  const cards     = useCards(id!) ?? []
  const stats     = useDeckStats(id!)
  const dueCount  = useDueCount(id!) ?? 0

  const [search, setSearch]       = useState('')
  const [showMenu, setShowMenu]   = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const filtered = useMemo(() =>
    search.trim()
      ? cards.filter(c =>
          c.front.text.toLowerCase().includes(search.toLowerCase()) ||
          c.back.text.toLowerCase().includes(search.toLowerCase())
        )
      : cards,
    [cards, search]
  )

  const masteredPct = stats && stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100) : 0

  async function handleDelete() {
    await deleteDeck(id!)
    toast.success('牌组已删除')
    navigate('/', { replace: true })
  }

  async function handleArchive() {
    await updateDeck(id!, { is_archived: true })
    toast.success('牌组已归档')
    navigate('/', { replace: true })
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = parseCSV(text)

    if (result.errors.length > 0 && result.rows.length === 0) {
      toast.error(result.errors[0])
      return
    }
    if (result.rows.length === 0) {
      toast.error('没有找到有效的卡片数据')
      return
    }

    const count = await bulkImportCards(id!, result.rows)
    let msg = `成功导入 ${count} 张卡片`
    if (result.duplicates.length > 0) msg += `，跳过 ${result.duplicates.length} 个重复`
    if (result.errors.length > 0) msg += `，${result.errors.length} 行有误`
    toast.success(msg)
    setShowImport(false)
    e.target.value = ''
  }

  if (!deck) return null

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-ink-950">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-safe-top pb-3 pt-4 bg-gray-50/80 dark:bg-ink-950/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white truncate">
          {deck.emoji} {deck.name}
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-ink-800 shadow-modal border border-gray-100 dark:border-white/8 z-30 overflow-hidden"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button onClick={() => { setShowImport(true); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                  <Upload size={15} /> 批量导入 CSV
                </button>
                <button onClick={() => { handleArchive(); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                  <Archive size={15} /> 归档牌组
                </button>
                <button onClick={() => { setShowDelete(true); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/8">
                  <Trash2 size={15} /> 删除牌组
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-4 mt-1">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: deck.color }} />
          <div className="bg-white dark:bg-ink-900 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{stats?.total ?? 0} 张卡片</span>
              {dueCount > 0 && <span className="text-red-500 font-medium">{dueCount} 到期</span>}
            </div>
            <ProgressBar value={masteredPct} size="md" />
            <p className="text-xs text-gray-400">{masteredPct}% 已掌握</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            fullWidth size="lg"
            onClick={() => navigate(`/review?deck=${id}`)}
            disabled={dueCount === 0}
          >
            复习 {dueCount > 0 ? `${dueCount}张` : '（暂无）'}
          </Button>
          <Button
            fullWidth size="lg" variant="secondary"
            onClick={() => navigate(`/card/new?deck=${id}`)}
          >
            <Plus size={18} /> 添加卡片
          </Button>
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索卡片..."
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>

        {/* 卡片列表 */}
        {cards.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">🗂️</span>}
            title="还没有卡片"
            description="添加卡片或批量导入 CSV"
            action={{ label: '添加卡片', onClick: () => navigate(`/card/new?deck=${id}`) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search size={24} />} title={`没有找到"${search}"相关卡片`} />
        ) : (
          <motion.ul className="space-y-2" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
            {filtered.map(card => (
              <motion.li key={card.id}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="flex items-center gap-3 bg-white dark:bg-ink-900 rounded-xl px-4 py-3 shadow-card dark:border dark:border-white/6"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{card.front.text}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{card.back.text}</p>
                </div>
                <Badge variant={cardBadgeVariant(card)} />
                <button
                  onClick={() => navigate(`/card/${card.id}?deck=${id}`)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                  aria-label="编辑卡片"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </main>

      {/* 删除确认 */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="删除牌组">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            确定要删除「{deck.name}」吗？该牌组下 <strong>{cards.length}</strong> 张卡片将被永久删除，此操作无法撤销。
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowDelete(false)}>取消</Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>确认删除</Button>
          </div>
        </div>
      </Modal>

      {/* CSV 导入说明 */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="批量导入 CSV">
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
            <p>front,back,tags</p>
            <p>apple,苹果,英语;CET-4</p>
            <p>banana,香蕉</p>
          </div>
          <p className="text-xs text-gray-400">第一行为表头，tags 列可选，多标签用 ; 分隔</p>
          <label className="block cursor-pointer">
            <span className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 transition-all duration-150">
              选择 CSV 文件
            </span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleImportCSV} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
