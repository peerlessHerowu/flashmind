import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { buildReviewQueue } from '@/hooks/useReviewQueue'
import { submitReview } from '@/hooks/useCard'
import { db, ensureSettings } from '@/db'
import { previewSchedule, formatNextReview } from '@/algorithm/fsrs'
import { Rating } from '@/types'
import type { Card } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import { Confetti } from '@/components/review/Confetti'

const RATING_CONFIG = [
  { rating: Rating.Again, label: '忘了',   color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-500/10',   border: 'border-red-200 dark:border-red-500/20',  active: 'bg-red-500 text-white' },
  { rating: Rating.Hard,  label: '模糊',   color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', active: 'bg-orange-500 text-white' },
  { rating: Rating.Good,  label: '记得',   color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-500/10',  border: 'border-blue-200 dark:border-blue-500/20', active: 'bg-blue-500 text-white' },
  { rating: Rating.Easy,  label: '很熟',   color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', active: 'bg-green-500 text-white' },
]

export function Review() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const deckId        = searchParams.get('deck') ?? null

  const [queue, setQueue]       = useState<Card[]>([])
  const [index, setIndex]       = useState(0)
  const [flipped, setFlipped]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [done, setDone]         = useState(false)
  const [previews, setPreviews] = useState<Record<Rating, number> | null>(null)
  const [history, setHistory]   = useState<Array<{ card: Card; rating: Rating }>>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [ratingLoading, setRatingLoading] = useState<Rating | null>(null)

  const flipStartRef = useRef<number>(Date.now())
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-150, 150], [-12, 12])
  const opacity = useTransform(x, [-150, -80, 0, 80, 150], [0, 1, 1, 1, 0])

  // 初始化队列
  useEffect(() => {
    async function init() {
      const settings = await ensureSettings()
      const q = await buildReviewQueue(deckId, settings.daily_review_limit, settings.daily_new_limit)
      if (q.length === 0) { setDone(true); setLoading(false); return }
      setQueue(q)
      setLoading(false)
    }
    init()
  }, [deckId])

  const currentCard = queue[index]

  // 预计算下次时间
  useEffect(() => {
    if (currentCard && flipped) {
      setPreviews(previewSchedule(currentCard))
    } else {
      setPreviews(null)
    }
  }, [currentCard, flipped])

  // 翻卡
  const flip = useCallback(() => {
    if (!flipped) {
      setFlipped(true)
      flipStartRef.current = Date.now()
    }
  }, [flipped])

  // 打分
  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentCard || ratingLoading) return
    setRatingLoading(rating)
    const duration = Date.now() - flipStartRef.current

    try {
      await submitReview(currentCard, rating, duration)
      setHistory(h => [...h, { card: currentCard, rating }])

      const next = index + 1
      if (next >= queue.length) {
        setShowConfetti(true)
        setTimeout(() => setDone(true), 1200)
      } else {
        setIndex(next)
        setFlipped(false)
        x.set(0)
      }
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setRatingLoading(null)
    }
  }, [currentCard, index, queue.length, ratingLoading, x])

  // 撤销
  const handleUndo = useCallback(async () => {
    if (history.length === 0 || index === 0) return
    const prev = history[history.length - 1]
    // 将上一张卡的 due 重置到当前时间（使其重新出现）
    await db.cards.update(prev.card.id, { due: Date.now(), state: prev.card.state })
    setHistory(h => h.slice(0, -1))
    setIndex(i => i - 1)
    setFlipped(false)
    toast('已撤销', { icon: '↩️' })
  }, [history, index])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done || loading) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() }
      if (flipped) {
        if (e.key === '1') handleRate(Rating.Again)
        if (e.key === '2') handleRate(Rating.Hard)
        if (e.key === '3') handleRate(Rating.Good)
        if (e.key === '4') handleRate(Rating.Easy)
        if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) handleUndo()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [done, loading, flipped, flip, handleRate, handleUndo])

  // ── 完成页 ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-6 text-center gap-6">
        {showConfetti && <Confetti />}
        <div className="space-y-2">
          <p className="text-6xl">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">今日复习完成！</h2>
          <p className="text-gray-500 dark:text-gray-400">共复习 {history.length} 张卡片</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-center">
          {Object.entries(
            history.reduce((acc, { rating }) => { acc[rating] = (acc[rating] ?? 0) + 1; return acc }, {} as Record<number, number>)
          ).map(([r, count]) => {
            const cfg = RATING_CONFIG.find(c => c.rating === Number(r))!
            return (
              <div key={r} className={cn('rounded-xl p-3', cfg.bg)}>
                <p className={cn('text-xl font-bold', cfg.color)}>{count}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            )
          })}
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs rounded-xl bg-primary-500 text-white py-3.5 font-semibold"
        >
          回首页
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!currentCard) return null

  const progress = queue.length > 0 ? ((index) / queue.length) * 100 : 0

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 顶栏 */}
      <header className="flex items-center gap-3 px-4 pt-safe-top pb-3 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-sm text-gray-400 tabular-nums min-w-[48px] text-right">
          {index}/{queue.length}
        </span>
        {history.length > 0 && (
          <button onClick={handleUndo} className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors" aria-label="撤销">
            <RotateCcw size={16} />
          </button>
        )}
      </header>

      {/* 卡片区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 gap-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + index}
            className="w-full max-w-sm"
            drag={flipped ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            style={{ x, rotate, opacity }}
            onDragEnd={(_, info) => {
              if (!flipped) return
              if (info.offset.x < -80)       handleRate(Rating.Again)
              else if (info.offset.x > 80)   handleRate(Rating.Easy)
              else                           x.set(0)
            }}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -16 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <FlashCard
              card={currentCard}
              flipped={flipped}
              onFlip={flip}
            />
          </motion.div>
        </AnimatePresence>

        {/* 评分按钮 */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              className="w-full max-w-sm grid grid-cols-4 gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22 }}
            >
              {RATING_CONFIG.map(({ rating, label, color, bg, border, active }, i) => (
                <motion.button
                  key={rating}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleRate(rating)}
                  disabled={ratingLoading !== null}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl py-3 px-1 border text-center',
                    'transition-all duration-150 active:scale-95 disabled:opacity-60',
                    ratingLoading === rating ? active : `${bg} ${border}`
                  )}
                >
                  <span className={cn('text-sm font-bold', ratingLoading === rating ? 'text-white' : color)}>
                    {label}
                  </span>
                  {previews && (
                    <span className={cn('text-[10px]', ratingLoading === rating ? 'text-white/80' : 'text-gray-400')}>
                      {formatNextReview(previews[rating])}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── FlashCard 内部组件 ────────────────────────────────────────────────────────

interface FlashCardProps {
  card: Card
  flipped: boolean
  onFlip: () => void
}

function FlashCard({ card, flipped, onFlip }: FlashCardProps) {
  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: '1200px', minHeight: '280px' }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={flipped ? '已翻转' : '点击翻转卡片'}
      onKeyDown={e => e.key === 'Enter' && onFlip()}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '280px',
        }}
      >
        {/* 正面 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-2xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed">
            {card.front.text}
          </p>
          <p className="mt-6 text-xs text-gray-300 dark:text-gray-600">点击翻转</p>
        </div>

        {/* 背面 */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 p-8 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center">{card.front.text}</p>
          <div className="my-4 h-px bg-gray-100 dark:bg-white/8" />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed">
              {card.back.text}
            </p>
          </div>
          {card.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {card.tags.map(tag => (
                <span key={tag} className="rounded-full bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 text-[11px] text-primary-500">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
