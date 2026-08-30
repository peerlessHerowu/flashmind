import { db } from '@/db'
import { applyRating, newCardFSRSState } from '@/algorithm/fsrs'
import type { Card, ImportRow } from '@/types'
import { Rating } from '@/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { scheduleSyncDebounced, pushChanges, getClientId } from '@/sync'
import { uuid } from '@/utils/uuid'

/** 指定牌组所有卡片（响应式） */
export function useCards(deckId: string) {
  return useLiveQuery(
    () => db.cards.where('deck_id').equals(deckId).sortBy('created_at'),
    [deckId],
    []
  )
}

/** 创建卡片 */
export async function createCard(
  deckId: string,
  front: string,
  back: string,
  tags: string[] = [],
  cardType: 'basic' | 'cloze' = 'basic'
): Promise<string> {
  const id  = uuid()
  const now = Date.now()
  const fsrs = newCardFSRSState()

  const card: Card = {
    id,
    deck_id: deckId,
    front:   { type: 'text', text: front },
    back:    { type: 'text', text: back },
    tags,
    card_type: cardType,
    is_suspended: false,
    created_at: now,
    updated_at: now,
    ...fsrs,
  }
  await db.cards.add(card)
  scheduleSyncDebounced()
  return id
}

/** 更新卡片内容 */
export async function updateCard(
  id: string,
  data: { front?: string; back?: string; tags?: string[]; card_type?: 'basic' | 'cloze' }
) {
  const updates: Partial<Card> = { updated_at: Date.now() }
  if (data.front     !== undefined) updates.front     = { type: 'text', text: data.front }
  if (data.back      !== undefined) updates.back      = { type: 'text', text: data.back }
  if (data.tags      !== undefined) updates.tags      = data.tags
  if (data.card_type !== undefined) updates.card_type = data.card_type
  await db.cards.update(id, updates)
  scheduleSyncDebounced()
}

/** 删除卡片 */
export async function deleteCard(id: string) {
  const now = Date.now()
  // 先通知服务端软删除
  const card = await db.cards.get(id)
  if (card) {
    await pushChanges({
      client_id: getClientId(),
      decks: [],
      cards: [{ ...card, deleted_at: now, updated_at: now }],
      review_logs: [],
    })
  }
  // 本地硬删
  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.reviewLogs.where('card_id').equals(id).delete()
    await db.cards.delete(id)
  })
}

/** 暂停 / 恢复卡片 */
export async function toggleSuspend(id: string, suspended: boolean) {
  await db.cards.update(id, { is_suspended: suspended, updated_at: Date.now() })
}

/** 批量导入卡片 */
export async function bulkImportCards(deckId: string, rows: ImportRow[]): Promise<number> {
  const now = Date.now()
  const cards: Card[] = rows.map(row => {
    const fsrs = newCardFSRSState()
    return {
      id: uuid(),
      deck_id: deckId,
      front: { type: 'text', text: row.front },
      back:  { type: 'text', text: row.back },
      tags: row.tags,
      is_suspended: false,
      created_at: now,
      updated_at: now,
      ...fsrs,
    }
  })
  await db.cards.bulkAdd(cards)
  scheduleSyncDebounced()
  return cards.length
}

/** 复习后更新卡片状态（含写日志） */
export async function submitReview(
  card: Card,
  rating: Rating,
  durationMs: number
): Promise<void> {
  const now    = new Date()
  const result = applyRating(card, rating, now)

  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.cards.update(card.id, {
      ...result,
      last_review: now.getTime(),
      updated_at:  now.getTime(),
    })
    await db.reviewLogs.add({
      id:                 uuid(),
      card_id:            card.id,
      deck_id:            card.deck_id,
      rating,
      state:              card.state,
      due:                card.due,
      stability:          card.stability,
      difficulty:         card.difficulty,
      elapsed_days:       card.elapsed_days,
      scheduled_days:     card.scheduled_days,
      review_duration_ms: durationMs,
      reviewed_at:        now.getTime(),
    })
  })
  scheduleSyncDebounced()
}
