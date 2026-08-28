import { db } from '@/db'
import { applyRating, newCardFSRSState } from '@/algorithm/fsrs'
import type { Card, ImportRow } from '@/types'
import { Rating } from '@/types'
import { useLiveQuery } from 'dexie-react-hooks'

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
  tags: string[] = []
): Promise<string> {
  const id  = crypto.randomUUID()
  const now = Date.now()
  const fsrs = newCardFSRSState()

  const card: Card = {
    id,
    deck_id: deckId,
    front:   { type: 'text', text: front },
    back:    { type: 'text', text: back },
    tags,
    is_suspended: false,
    created_at: now,
    updated_at: now,
    ...fsrs,
  }
  await db.cards.add(card)
  return id
}

/** 更新卡片内容 */
export async function updateCard(
  id: string,
  data: { front?: string; back?: string; tags?: string[] }
) {
  const updates: Partial<Card> = { updated_at: Date.now() }
  if (data.front !== undefined) updates.front = { type: 'text', text: data.front }
  if (data.back  !== undefined) updates.back  = { type: 'text', text: data.back }
  if (data.tags  !== undefined) updates.tags  = data.tags
  await db.cards.update(id, updates)
}

/** 删除卡片 */
export async function deleteCard(id: string) {
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
      id: crypto.randomUUID(),
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
      id:                 crypto.randomUUID(),
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
}
