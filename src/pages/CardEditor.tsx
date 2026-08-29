import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { db } from '@/db'
import { createCard, updateCard, deleteCard } from '@/hooks/useCard'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Card } from '@/types'
import toast from 'react-hot-toast'

export function CardEditor() {
  const { id }          = useParams<{ id: string }>()
  const [searchParams]  = useSearchParams()
  const deckId          = searchParams.get('deck') ?? ''
  const navigate        = useNavigate()
  const isNew           = id === 'new'

  const [front, setFront]     = useState('')
  const [back, setBack]       = useState('')
  const [tags, setTags]       = useState('')
  const [loading, setLoading] = useState(false)
  const [showDel, setShowDel] = useState(false)
  const [card, setCard]       = useState<Card | null>(null)
  const frontRef              = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isNew && id) {
      db.cards.get(id).then(c => {
        if (c) { setCard(c); setFront(c.front.text); setBack(c.back.text); setTags(c.tags.join('; ')) }
      })
    }
  }, [id, isNew])

  // Cmd+Enter 保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  async function handleSave() {
    if (!front.trim() || !back.trim()) return
    setLoading(true)
    try {
      const parsedTags = tags.split(/[;，,]/).map(t => t.trim()).filter(Boolean)
      if (isNew) {
        await createCard(deckId, front.trim(), back.trim(), parsedTags)
        toast.success('卡片已保存')
        setFront(''); setBack(''); setTags('')
        frontRef.current?.focus()
      } else {
        await updateCard(id!, { front: front.trim(), back: back.trim(), tags: parsedTags })
        toast.success('已更新')
        navigate(-1)
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await deleteCard(id!)
    toast.success('卡片已删除')
    navigate(-1)
  }

  const canSave = front.trim().length > 0 && back.trim().length > 0

  return (
    <div className="flex flex-col min-h-screen bg-paper-50 dark:bg-ink-950">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-safe-top pb-3 pt-4 bg-gray-50/80 dark:bg-ink-950/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">
          {isNew ? '新建卡片' : '编辑卡片'}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={() => setShowDel(true)} className="p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Trash2 size={18} />
            </button>
          )}
          <Button size="sm" onClick={handleSave} loading={loading} disabled={!canSave}>
            {isNew ? '保存' : '更新'}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8 space-y-4 mt-2">
        {/* 正面 */}
        <div className="bg-white dark:bg-ink-900 rounded-2xl p-4 space-y-2 shadow-card dark:border dark:border-white/6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">正面</p>
          <Textarea
            ref={frontRef}
            value={front}
            onChange={e => setFront(e.target.value)}
            placeholder="输入正面内容..."
            rows={4}
            autoFocus={isNew}
            className="border-0 p-0 text-base font-medium bg-transparent focus:ring-0 resize-none"
          />
        </div>

        {/* 背面 */}
        <div className="bg-white dark:bg-ink-900 rounded-2xl p-4 space-y-2 shadow-card dark:border dark:border-white/6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">背面</p>
          <Textarea
            value={back}
            onChange={e => setBack(e.target.value)}
            placeholder="输入背面内容..."
            rows={4}
            className="border-0 p-0 text-base bg-transparent focus:ring-0 resize-none"
          />
        </div>

        {/* 标签 */}
        <div className="bg-white dark:bg-ink-900 rounded-2xl p-4 space-y-2 shadow-card dark:border dark:border-white/6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">标签（可选）</p>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="英语; CET-6; 词汇（分号分隔）"
            className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* 预览 */}
        {(front || back) && (
          <div className="rounded-2xl bg-primary-50 dark:bg-primary-500/8 p-4 space-y-2">
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide">预览</p>
            <div className="flex flex-col gap-2">
              {front && <p className="text-base font-semibold text-gray-900 dark:text-white">{front}</p>}
              {front && back && <div className="h-px bg-primary-200 dark:bg-primary-500/20" />}
              {back && <p className="text-sm text-gray-600 dark:text-gray-400">{back}</p>}
            </div>
          </div>
        )}

        {isNew && (
          <p className="text-center text-xs text-gray-400">保存后自动清空，可连续添加卡片 · ⌘+Enter</p>
        )}
      </main>

      <Modal open={showDel} onClose={() => setShowDel(false)} title="删除卡片">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">确定删除这张卡片吗？所有复习记录也将删除，此操作无法撤销。</p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowDel(false)}>取消</Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>确认删除</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
