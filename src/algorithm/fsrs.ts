import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating as FSRSRating,
  type Card as FSRSCard,
  State,
} from 'ts-fsrs'
import type { Card } from '@/types'
import { CardState, Rating } from '@/types'

const params = generatorParameters()
const scheduler = fsrs(params)

// ─── 类型转换 ────────────────────────────────────────────────────────────────

/** 将内部 Card 转为 ts-fsrs Card 格式 */
export function toFSRSCard(card: Card): FSRSCard {
  return {
    due:            new Date(card.due),
    stability:      card.stability,
    difficulty:     card.difficulty,
    elapsed_days:   card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps:           card.reps,
    lapses:         card.lapses,
    state:          card.state as unknown as State,
    last_review:    card.last_review ? new Date(card.last_review) : undefined,
  }
}

/** 将内部 Rating 转为 ts-fsrs Rating */
function toFSRSRating(rating: Rating): FSRSRating {
  switch (rating) {
    case Rating.Again: return FSRSRating.Again
    case Rating.Hard:  return FSRSRating.Hard
    case Rating.Good:  return FSRSRating.Good
    case Rating.Easy:  return FSRSRating.Easy
  }
}

// ─── 核心接口 ─────────────────────────────────────────────────────────────────

export interface ScheduleResult {
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: CardState
}

/** 对卡片应用评分，返回新的调度状态 */
export function applyRating(card: Card, rating: Rating, now: Date = new Date()): ScheduleResult {
  const fsrsCard = toFSRSCard(card)
  const result   = scheduler.repeat(fsrsCard, now)
  const next     = result[toFSRSRating(rating)].card

  return {
    due:            next.due.getTime(),
    stability:      next.stability,
    difficulty:     next.difficulty,
    elapsed_days:   next.elapsed_days,
    scheduled_days: next.scheduled_days,
    reps:           next.reps,
    lapses:         next.lapses,
    state:          next.state as unknown as CardState,
  }
}

/** 预览各评分的下次复习时间（不修改卡片），用于按钮上显示 */
export function previewSchedule(card: Card, now: Date = new Date()): Record<Rating, number> {
  const fsrsCard = toFSRSCard(card)
  const result   = scheduler.repeat(fsrsCard, now)

  return {
    [Rating.Again]: result[FSRSRating.Again].card.due.getTime(),
    [Rating.Hard]:  result[FSRSRating.Hard].card.due.getTime(),
    [Rating.Good]:  result[FSRSRating.Good].card.due.getTime(),
    [Rating.Easy]:  result[FSRSRating.Easy].card.due.getTime(),
  }
}

/** 创建新卡片的 FSRS 初始状态 */
export function newCardFSRSState(): Omit<ScheduleResult, 'state'> & { state: CardState } {
  const empty = createEmptyCard()
  return {
    due:            empty.due.getTime(),
    stability:      empty.stability,
    difficulty:     empty.difficulty,
    elapsed_days:   empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps:           empty.reps,
    lapses:         empty.lapses,
    state:          CardState.New,
  }
}

/** 格式化下次复习时间为人类可读字符串 */
export function formatNextReview(dueMs: number, now: Date = new Date()): string {
  const diff = dueMs - now.getTime()
  const mins = Math.round(diff / 60000)
  const hours = Math.round(diff / 3600000)
  const days = Math.round(diff / 86400000)

  if (diff < 60000) return '< 1分钟'
  if (mins < 60)   return `${mins}分钟`
  if (hours < 24)  return `${hours}小时`
  if (days === 1)  return '明天'
  if (days < 30)   return `${days}天`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}个月`
  return `${Math.round(months / 12)}年`
}
