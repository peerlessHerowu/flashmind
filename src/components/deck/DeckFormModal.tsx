import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DECK_COLORS, createDeck, updateDeck } from '@/hooks/useDeck'
import type { Deck } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const EMOJIS = ['📚', '🔬', '🧮', '🌍', '💻', '🎵', '🏃', '🍳', '✈️', '🎨', '⚡', '🔑']

interface DeckFormModalProps {
  open: boolean
  onClose: () => void
  deck?: Deck   // 编辑模式时传入
}

export function DeckFormModal({ open, onClose, deck }: DeckFormModalProps) {
  const isEdit = !!deck
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [emoji, setEmoji]     = useState('📚')
  const [color, setColor]     = useState(DECK_COLORS[0])
  const [loading, setLoading] = useState(false)

  // 编辑时填充现有数据
  useEffect(() => {
    if (deck) {
      setName(deck.name)
      setDesc(deck.description ?? '')
      setEmoji(deck.emoji ?? '📚')
      setColor(deck.color)
    } else {
      setName(''); setDesc(''); setEmoji('📚'); setColor(DECK_COLORS[0])
    }
  }, [deck, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      if (isEdit) {
        await updateDeck(deck!.id, { name: name.trim(), description: desc.trim() || undefined, emoji, color })
        toast.success('牌组已更新')
      } else {
        await createDeck({ name: name.trim(), description: desc.trim() || undefined, emoji, color, is_archived: false })
        toast.success('牌组已创建')
      }
      onClose()
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? '编辑牌组' : '新建牌组'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 封面预览 */}
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ backgroundColor: color }}>
            <span className="absolute inset-0 flex items-center justify-center text-2xl">{emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="牌组名称"
              maxLength={50}
              autoFocus
              required
            />
          </div>
        </div>

        {/* emoji 选择 */}
        <div>
          <p className="text-xs font-medium text-paper-500 dark:text-ink-400 mb-2">图标</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  'h-9 w-9 rounded-xl text-lg transition-all',
                  emoji === e
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-500/10 scale-110'
                    : 'hover:bg-paper-100 dark:hover:bg-ink-800'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 颜色选择 */}
        <div>
          <p className="text-xs font-medium text-paper-500 dark:text-ink-400 mb-2">颜色</p>
          <div className="flex flex-wrap gap-2">
            {DECK_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform',
                  color === c ? 'scale-125 ring-2 ring-offset-2 ring-paper-300 dark:ring-ink-600' : 'hover:scale-110'
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {/* 描述 */}
        <Input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="描述（可选）"
          maxLength={200}
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>取消</Button>
          <Button type="submit" loading={loading} disabled={!name.trim()} fullWidth>
            {isEdit ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
