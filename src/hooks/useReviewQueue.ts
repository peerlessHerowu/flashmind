import { db } from '@/db'
import { CardState } from '@/types'
import type { Card } from '@/types'
import { useLiveQuery } from 'dexie-react-hooks'

/** 获取今日复习队列（到期 + 新卡） */
export async function buildReviewQueue(
  deckId: string | null,
  reviewLimit: number,
  newLimit: number
): Promise<Card[]> {
  const now = Date.now()

  // 取到期复习卡（非新卡、未暂停、due <= now）
  let dueQuery = db.cards
    .filter(c => c.state !== CardState.New && c.due <= now && !c.is_suspended)
  if (deckId) dueQuery = db.cards
    .where('[deck_id+due]')
    .between([deckId, 0], [deckId, now], true, true)
    .filter(c => c.state !== CardState.New && !c.is_suspended) as typeof dueQuery

  const dueCards = await dueQuery.limit(reviewLimit).toArray()

  // 取新卡（state === New，未暂停）
  let newQuery = db.cards.filter(c => c.state === CardState.New && !c.is_suspended)
  if (deckId) newQuery = db.cards
    .where('deck_id').equals(deckId)
    .filter(c => c.state === CardState.New && !c.is_suspended) as typeof newQuery

  const newCards = await newQuery.limit(newLimit).toArray()

  // 合并：先复习到期卡，再新卡；各自内部随机打散
  return [...shuffle(dueCards), ...shuffle(newCards)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 今日待复习数量（响应式，用于首页badge） */
export function useDueCount(deckId?: string) {
  return useLiveQuery(async () => {
    const now = Date.now()
    let q = db.cards.filter(c => c.state !== CardState.New && c.due <= now && !c.is_suspended)
    if (deckId) q = db.cards
      .where('deck_id').equals(deckId)
      .filter(c => c.state !== CardState.New && c.due <= now && !c.is_suspended) as typeof q
    return q.count()
  }, [deckId], 0)
}

/** 今日新卡数量 */
export function useNewCount(deckId?: string) {
  return useLiveQuery(async () => {
    let q = db.cards.filter(c => c.state === CardState.New && !c.is_suspended)
    if (deckId) q = db.cards
      .where('deck_id').equals(deckId)
      .filter(c => c.state === CardState.New && !c.is_suspended) as typeof q
    return q.count()
  }, [deckId], 0)
}
