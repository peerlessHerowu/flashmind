// ─── 枚举 ───────────────────────────────────────────────────────────────────

export enum CardState {
  New        = 0,
  Learning   = 1,
  Review     = 2,
  Relearning = 3,
}

export enum Rating {
  Again = 1, // 忘了
  Hard  = 2, // 模糊
  Good  = 3, // 记得
  Easy  = 4, // 很熟
}

// ─── 卡片内容 ────────────────────────────────────────────────────────────────

export interface CardContent {
  type: 'text' | 'markdown'
  text: string
  image_id?: string
}

// ─── 牌组 ────────────────────────────────────────────────────────────────────

export interface Deck {
  id: string
  name: string
  description?: string
  emoji?: string
  color: string           // hex，如 "#6366F1"
  is_archived: boolean
  created_at: number      // UTC ms
  updated_at: number
}

// ─── 卡片 ────────────────────────────────────────────────────────────────────

export interface Card {
  id: string
  deck_id: string

  // 内容
  front: CardContent
  back: CardContent
  tags: string[]

  // FSRS-5 状态
  due: number             // UTC ms
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: CardState
  last_review?: number    // UTC ms

  // 元数据
  is_suspended: boolean
  created_at: number
  updated_at: number
}

// ─── 复习日志 ─────────────────────────────────────────────────────────────────

export interface ReviewLog {
  id: string
  card_id: string
  deck_id: string
  rating: Rating
  state: CardState
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  review_duration_ms: number
  reviewed_at: number
}

// ─── 媒体 ────────────────────────────────────────────────────────────────────

export interface Media {
  id: string
  data: string            // base64
  mime_type: string
  size_bytes: number
  width: number
  height: number
  created_at: number
}

// ─── 设置 ────────────────────────────────────────────────────────────────────

export interface Settings {
  id: 'default'
  daily_review_limit: number
  daily_new_limit: number
  review_order: 'random' | 'due'
  theme: 'light' | 'dark' | 'system'
  reminder_enabled: boolean
  reminder_time?: string
  updated_at: number
}

// ─── 牌组统计 ─────────────────────────────────────────────────────────────────

export interface DeckStats {
  total: number
  new_count: number
  learning: number
  review: number
  due: number
  mastered: number        // scheduled_days >= 21
}

// ─── CSV 导入 ─────────────────────────────────────────────────────────────────

export interface ImportRow {
  front: string
  back: string
  tags: string[]
}

export interface ImportResult {
  rows: ImportRow[]
  duplicates: string[]    // front 文字重复的
  errors: string[]
}

// ─── 复习会话 ─────────────────────────────────────────────────────────────────

export interface ReviewSession {
  deck_id: string | null  // null = 全部牌组
  queue: Card[]
  current_index: number
  started_at: number
  reviewed: Array<{ card: Card; rating: Rating; duration_ms: number }>
}
