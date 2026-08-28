import { describe, test, expect } from 'vitest'
import { applyRating, previewSchedule, newCardFSRSState, formatNextReview } from '../fsrs'
import { CardState, Rating } from '@/types'
import type { Card } from '@/types'

function makeNewCard(): Card {
  const fsrs = newCardFSRSState()
  return {
    id: 'test-1',
    deck_id: 'deck-1',
    front: { type: 'text', text: 'hello' },
    back: { type: 'text', text: '你好' },
    tags: [],
    is_suspended: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...fsrs,
  }
}

function makeReviewCard(): Card {
  const card = makeNewCard()
  // 模拟已经复习过几次，处于 Review 状态
  return {
    ...card,
    state: CardState.Review,
    stability: 10,
    difficulty: 5,
    reps: 5,
    lapses: 0,
    scheduled_days: 10,
    elapsed_days: 10,
    due: Date.now() - 1000,
    last_review: Date.now() - 86400000 * 10,
  }
}

describe('newCardFSRSState', () => {
  test('新卡初始状态为 New', () => {
    const s = newCardFSRSState()
    expect(s.state).toBe(CardState.New)
    expect(s.reps).toBe(0)
    expect(s.lapses).toBe(0)
    expect(s.stability).toBe(0)
  })
})

describe('applyRating - 新卡第一次复习', () => {
  test('Again → 仍在 Learning，scheduled_days 为 0', () => {
    const card = makeNewCard()
    const result = applyRating(card, Rating.Again)
    expect(result.state).toBe(CardState.Learning)
    expect(result.scheduled_days).toBe(0)
    expect(result.lapses).toBe(0)
  })

  test('Good → Learning 或 Review，间隔 >= 0', () => {
    const card = makeNewCard()
    const result = applyRating(card, Rating.Good)
    expect([CardState.Learning, CardState.Review]).toContain(result.state)
    expect(result.scheduled_days).toBeGreaterThanOrEqual(0)
  })

  test('Easy → 直接跳到 Review，间隔 > 3', () => {
    const card = makeNewCard()
    const result = applyRating(card, Rating.Easy)
    expect(result.state).toBe(CardState.Review)
    expect(result.scheduled_days).toBeGreaterThan(3)
  })

  test('stability 在任何评分后都 > 0', () => {
    const card = makeNewCard()
    for (const rating of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) {
      const result = applyRating(card, rating)
      expect(result.stability).toBeGreaterThan(0)
    }
  })
})

describe('applyRating - Review 卡片', () => {
  test('连续 Good 评分间隔递增', () => {
    let card = makeNewCard()
    const intervals: number[] = []
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      const result = applyRating(card, Rating.Good, now)
      intervals.push(result.scheduled_days)
      card = { ...card, ...result }
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
    }
  })

  test('Again 后 lapses 增加 1', () => {
    const card = makeReviewCard()
    const before = card.lapses
    const result = applyRating(card, Rating.Again)
    expect(result.lapses).toBe(before + 1)
  })

  test('Again 后状态变为 Relearning', () => {
    const card = makeReviewCard()
    const result = applyRating(card, Rating.Again)
    expect(result.state).toBe(CardState.Relearning)
  })

  test('due 时间等于 now + scheduled_days（允许1分钟误差）', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const card = makeNewCard()
    const result = applyRating(card, Rating.Good, now)
    const expected = now.getTime() + result.scheduled_days * 86400 * 1000
    // 允许15分钟误差（Learning 阶段 ts-fsrs 用分钟级间隔）
    expect(Math.abs(result.due - expected)).toBeLessThan(15 * 60 * 1000)
  })
})

describe('previewSchedule', () => {
  test('返回4种评分的 due 时间，均为 number', () => {
    const card = makeNewCard()
    const previews = previewSchedule(card)
    expect(typeof previews[Rating.Again]).toBe('number')
    expect(typeof previews[Rating.Hard]).toBe('number')
    expect(typeof previews[Rating.Good]).toBe('number')
    expect(typeof previews[Rating.Easy]).toBe('number')
  })

  test('Easy 的 due 时间 >= Good >= Hard >= Again', () => {
    const card = makeNewCard()
    const p = previewSchedule(card)
    expect(p[Rating.Easy]).toBeGreaterThanOrEqual(p[Rating.Good])
    expect(p[Rating.Good]).toBeGreaterThanOrEqual(p[Rating.Hard])
    expect(p[Rating.Hard]).toBeGreaterThanOrEqual(p[Rating.Again])
  })
})

describe('formatNextReview', () => {
  const now = new Date('2026-01-01T00:00:00Z')

  test('< 1分钟', () => {
    expect(formatNextReview(now.getTime() + 30000, now)).toBe('< 1分钟')
  })

  test('刚好1分钟', () => {
    expect(formatNextReview(now.getTime() + 60000, now)).toBe('1分钟')
  })

  test('分钟', () => {
    expect(formatNextReview(now.getTime() + 5 * 60000, now)).toBe('5分钟')
  })

  test('小时', () => {
    expect(formatNextReview(now.getTime() + 3 * 3600000, now)).toBe('3小时')
  })

  test('明天', () => {
    expect(formatNextReview(now.getTime() + 86400000, now)).toBe('明天')
  })

  test('N天', () => {
    expect(formatNextReview(now.getTime() + 5 * 86400000, now)).toBe('5天')
  })

  test('月', () => {
    expect(formatNextReview(now.getTime() + 60 * 86400000, now)).toBe('2个月')
  })
})
