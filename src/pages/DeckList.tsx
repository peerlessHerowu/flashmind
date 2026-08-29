import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDecks } from '@/hooks/useDeck'
import { DeckCard } from '@/components/deck/DeckCard'
import { DeckFormModal } from '@/components/deck/DeckFormModal'
import { EmptyState } from '@/components/ui/EmptyState'

export function DeckList() {
  const navigate    = useNavigate()
  const decks       = useDecks() ?? []
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-safe-top pb-3 pt-5 bg-paper-50/90 dark:bg-ink-950/90 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">我的牌组</h1>
        <button
          onClick={() => setShow(true)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors"
          aria-label="新建牌组"
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-24 mt-3">
        {decks.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">📚</span>}
            title="还没有牌组"
            description="点击右上角 + 创建第一个牌组"
            action={{ label: '创建牌组', onClick: () => setShow(true) }}
          />
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {decks.map(deck => (
              <motion.div key={deck.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <DeckCard deck={deck} onClick={() => navigate(`/deck/${deck.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <DeckFormModal open={show} onClose={() => setShow(false)} />
    </div>
  )
}
