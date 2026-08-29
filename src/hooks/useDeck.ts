import { db } from '@/db'
import type { Deck, DeckStats } from '@/types'
import { CardState } from '@/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { scheduleSyncDebounced, pushChanges, getClientId } from '@/sync'
import { uuid } from '@/utils/uuid'

/** 所有未归档牌组（响应式） */
export function useDecks() {
  return useLiveQuery(
    () => db.decks.filter(d => !d.is_archived).sortBy('created_at'),
    [],
    []
  )
}

/** 指定牌组（响应式） */
export function useDeck(id: string) {
  return useLiveQuery(() => db.decks.get(id), [id])
}

/** 创建牌组 */
export async function createDeck(data: Omit<Deck, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const id = uuid()
  const now = Date.now()
  await db.decks.add({ ...data, id, created_at: now, updated_at: now })
  scheduleSyncDebounced()
  return id
}

/** 更新牌组 */
export async function updateDeck(id: string, data: Partial<Omit<Deck, 'id' | 'created_at'>>) {
  await db.decks.update(id, { ...data, updated_at: Date.now() })
  scheduleSyncDebounced()
}

/** 删除牌组及其所有卡片 */
export async function deleteDeck(id: string) {
  const now = Date.now()
  // 1. 先通知服务端软删除
  const deck = await db.decks.get(id)
  if (deck) {
    await pushChanges({
      client_id: getClientId(),
      decks: [{ ...deck, deleted_at: now, updated_at: now }],
      cards: [],
      review_logs: [],
    })
  }
  // 2. 本地硬删
  await db.transaction('rw', db.decks, db.cards, db.reviewLogs, async () => {
    const cardIds = await db.cards.where('deck_id').equals(id).primaryKeys()
    await db.reviewLogs.where('card_id').anyOf(cardIds as string[]).delete()
    await db.cards.where('deck_id').equals(id).delete()
    await db.decks.delete(id)
  })
}

/** 获取牌组统计 */
export async function getDeckStats(deckId: string): Promise<DeckStats> {
  const cards = await db.cards.where('deck_id').equals(deckId).toArray()
  const now = Date.now()
  return {
    total:    cards.length,
    new_count: cards.filter(c => c.state === CardState.New).length,
    learning: cards.filter(c => c.state === CardState.Learning || c.state === CardState.Relearning).length,
    review:   cards.filter(c => c.state === CardState.Review).length,
    due:      cards.filter(c => c.due <= now && c.state !== CardState.New && !c.is_suspended).length,
    mastered: cards.filter(c => c.scheduled_days >= 21).length,
  }
}

/** 响应式牌组统计 */
export function useDeckStats(deckId: string) {
  return useLiveQuery(() => getDeckStats(deckId), [deckId])
}

// 预设封面颜色
export const DECK_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6B7280', '#1E293B',
]
