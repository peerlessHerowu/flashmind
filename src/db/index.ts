import Dexie, { type Table } from 'dexie'
import type { Deck, Card, ReviewLog, Media, Settings } from '@/types'

class FlashMindDB extends Dexie {
  decks!: Table<Deck>
  cards!: Table<Card>
  reviewLogs!: Table<ReviewLog>
  media!: Table<Media>
  settings!: Table<Settings>

  constructor() {
    super('flashmind')

    this.version(1).stores({
      decks:      'id, is_archived, created_at',
      cards:      'id, deck_id, due, state, *tags, [deck_id+due], [deck_id+state]',
      reviewLogs: 'id, card_id, deck_id, reviewed_at, [deck_id+reviewed_at]',
      media:      'id',
      settings:   'id',
    })
  }
}

export const db = new FlashMindDB()

// 初始化默认设置
export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('default')
  if (existing) return existing

  const defaults: Settings = {
    id: 'default',
    daily_review_limit: 200,
    daily_new_limit: 20,
    review_order: 'random',
    theme: 'system',
    reminder_enabled: false,
    updated_at: Date.now(),
  }
  await db.settings.add(defaults)
  return defaults
}
