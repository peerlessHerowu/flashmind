import { describe, test, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/db'
import { buildReviewQueue } from '../useReviewQueue'
import { newCardFSRSState } from '@/algorithm/fsrs'
import { CardState } from '@/types'
import type { Card } from '@/types'

function makeCard(overrides: Partial<Card> & { id: string; deck_id: string }): Card {
  const fsrs = newCardFSRSState()
  return {
    front: { type: 'text', text: 'front' },
    back:  { type: 'text', text: 'back' },
    tags: [],
    is_suspended: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...fsrs,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.cards.clear()
  await db.decks.clear()
})

describe('buildReviewQueue', () => {
  test('只返回到期卡片，不返回未到期卡片', async () => {
    const deckId = 'deck-1'
    await db.cards.bulkAdd([
      makeCard({ id: 'c1', deck_id: deckId, state: CardState.Review, due: Date.now() - 1000 }),
      makeCard({ id: 'c2', deck_id: deckId, state: CardState.Review, due: Date.now() + 86400000 }),
    ])
    const q = await buildReviewQueue(deckId, 200, 20)
    expect(q.map(c => c.id)).toContain('c1')
    expect(q.map(c => c.id)).not.toContain('c2')
  })

  test('新卡（state=New）不算到期卡，走新卡配额', async () => {
    const deckId = 'deck-1'
    await db.cards.bulkAdd([
      makeCard({ id: 'c1', deck_id: deckId, state: CardState.New, due: Date.now() - 1000 }),
    ])
    const q = await buildReviewQueue(deckId, 200, 20)
    expect(q).toHaveLength(1)
    expect(q[0].id).toBe('c1')
  })

  test('暂停的卡片不出现在队列中', async () => {
    const deckId = 'deck-1'
    await db.cards.bulkAdd([
      makeCard({ id: 'c1', deck_id: deckId, state: CardState.Review, due: Date.now() - 1000, is_suspended: true }),
      makeCard({ id: 'c2', deck_id: deckId, state: CardState.New, due: Date.now() - 1000, is_suspended: true }),
    ])
    const q = await buildReviewQueue(deckId, 200, 20)
    expect(q).toHaveLength(0)
  })

  test('超过 reviewLimit 时只返回 limit 条到期卡', async () => {
    const deckId = 'deck-1'
    const cards = Array.from({ length: 30 }, (_, i) =>
      makeCard({ id: `c${i}`, deck_id: deckId, state: CardState.Review, due: Date.now() - 1000 })
    )
    await db.cards.bulkAdd(cards)
    const q = await buildReviewQueue(deckId, 10, 0)
    expect(q.length).toBeLessThanOrEqual(10)
  })

  test('超过 newLimit 时只返回 limit 条新卡', async () => {
    const deckId = 'deck-1'
    const cards = Array.from({ length: 30 }, (_, i) =>
      makeCard({ id: `c${i}`, deck_id: deckId, state: CardState.New })
    )
    await db.cards.bulkAdd(cards)
    const q = await buildReviewQueue(deckId, 200, 5)
    expect(q.length).toBeLessThanOrEqual(5)
  })

  test('deckId=null 时跨牌组查询', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'c1', deck_id: 'deck-1', state: CardState.Review, due: Date.now() - 1000 }),
      makeCard({ id: 'c2', deck_id: 'deck-2', state: CardState.Review, due: Date.now() - 1000 }),
    ])
    const q = await buildReviewQueue(null, 200, 20)
    expect(q.map(c => c.id)).toContain('c1')
    expect(q.map(c => c.id)).toContain('c2')
  })

  test('到期卡排在新卡前面', async () => {
    const deckId = 'deck-1'
    await db.cards.bulkAdd([
      makeCard({ id: 'new1', deck_id: deckId, state: CardState.New }),
      makeCard({ id: 'due1', deck_id: deckId, state: CardState.Review, due: Date.now() - 1000 }),
    ])
    const q = await buildReviewQueue(deckId, 200, 20)
    const dueIdx = q.findIndex(c => c.id === 'due1')
    const newIdx = q.findIndex(c => c.id === 'new1')
    expect(dueIdx).toBeLessThan(newIdx)
  })
})
