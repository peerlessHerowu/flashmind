import type { FastifyInstance } from 'fastify'
import { db } from '../db.ts'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface CardContent { type: string; text: string }

interface Deck {
  id: string; name: string; description?: string; emoji?: string
  color: string; is_archived: boolean
  created_at: number; updated_at: number; deleted_at?: number
}

interface Card {
  id: string; deck_id: string
  front: CardContent; back: CardContent
  tags: string[]
  due: number; stability: number; difficulty: number
  elapsed_days: number; scheduled_days: number
  reps: number; lapses: number; state: number
  last_review?: number; is_suspended: boolean
  created_at: number; updated_at: number; deleted_at?: number
}

interface ReviewLog {
  id: string; card_id: string; deck_id: string
  rating: number; state: number; due: number
  stability: number; difficulty: number
  elapsed_days: number; scheduled_days: number
  review_duration_ms: number; reviewed_at: number
}

interface PushBody {
  client_id: string
  decks: Deck[]
  cards: Card[]
  review_logs: ReviewLog[]
}

// ── row 转换 ──────────────────────────────────────────────────────────────────

function rowToCard(r: Record<string, unknown>): Card {
  return {
    id:             String(r.id),
    deck_id:        String(r.deck_id),
    front:          { type: String(r.front_type), text: String(r.front_text) },
    back:           { type: String(r.back_type),  text: String(r.back_text)  },
    tags:           JSON.parse(String(r.tags || '[]')),
    due:            Number(r.due),
    stability:      Number(r.stability),
    difficulty:     Number(r.difficulty),
    elapsed_days:   Number(r.elapsed_days),
    scheduled_days: Number(r.scheduled_days),
    reps:           Number(r.reps),
    lapses:         Number(r.lapses),
    state:          Number(r.state),
    last_review:    r.last_review != null ? Number(r.last_review) : undefined,
    is_suspended:   Boolean(r.is_suspended),
    created_at:     Number(r.created_at),
    updated_at:     Number(r.updated_at),
    deleted_at:     r.deleted_at != null ? Number(r.deleted_at) : undefined,
  }
}

function rowToDeck(r: Record<string, unknown>): Deck {
  return {
    id:          String(r.id),
    name:        String(r.name),
    description: r.description != null ? String(r.description) : undefined,
    emoji:       r.emoji       != null ? String(r.emoji)       : undefined,
    color:       String(r.color),
    is_archived: Boolean(r.is_archived),
    created_at:  Number(r.created_at),
    updated_at:  Number(r.updated_at),
    deleted_at:  r.deleted_at != null ? Number(r.deleted_at) : undefined,
  }
}

// ── 预编译 statements ──────────────────────────────────────────────────────────

const stmtUpsertDeck = db.prepare(`
  INSERT INTO decks (id, name, description, emoji, color, is_archived, created_at, updated_at, deleted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name        = excluded.name,
    description = excluded.description,
    emoji       = excluded.emoji,
    color       = excluded.color,
    is_archived = excluded.is_archived,
    updated_at  = excluded.updated_at,
    deleted_at  = excluded.deleted_at
  WHERE excluded.updated_at >= decks.updated_at
`)

const stmtUpsertCard = db.prepare(`
  INSERT INTO cards
    (id, deck_id, front_text, front_type, back_text, back_type, tags,
     due, stability, difficulty, elapsed_days, scheduled_days,
     reps, lapses, state, last_review, is_suspended, created_at, updated_at, deleted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    deck_id        = excluded.deck_id,
    front_text     = excluded.front_text,
    front_type     = excluded.front_type,
    back_text      = excluded.back_text,
    back_type      = excluded.back_type,
    tags           = excluded.tags,
    due            = excluded.due,
    stability      = excluded.stability,
    difficulty     = excluded.difficulty,
    elapsed_days   = excluded.elapsed_days,
    scheduled_days = excluded.scheduled_days,
    reps           = excluded.reps,
    lapses         = excluded.lapses,
    state          = excluded.state,
    last_review    = excluded.last_review,
    is_suspended   = excluded.is_suspended,
    updated_at     = excluded.updated_at,
    deleted_at     = excluded.deleted_at
  WHERE excluded.updated_at >= cards.updated_at
`)

const stmtInsertLog = db.prepare(`
  INSERT OR IGNORE INTO review_logs
    (id, card_id, deck_id, rating, state, due, stability, difficulty,
     elapsed_days, scheduled_days, review_duration_ms, reviewed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const stmtUpsertMeta = db.prepare(`
  INSERT INTO sync_meta (client_id, last_push_at) VALUES (?, ?)
  ON CONFLICT(client_id) DO UPDATE SET last_push_at = excluded.last_push_at
`)

// ── 路由 ─────────────────────────────────────────────────────────────────────

export async function syncRoutes(app: FastifyInstance) {

  // POST /sync/push
  app.post<{ Body: PushBody }>('/sync/push', async (req, reply) => {
    const { client_id, decks = [], cards = [], review_logs = [] } = req.body
    if (!client_id) return reply.status(400).send({ ok: false, error: 'missing client_id' })

    try {
      // node:sqlite 没有内置事务封装，用 BEGIN/COMMIT
      db.exec('BEGIN')
      try {
        for (const d of decks) {
          stmtUpsertDeck.run(
            d.id, d.name, d.description ?? null, d.emoji ?? null, d.color,
            d.is_archived ? 1 : 0, d.created_at, d.updated_at, d.deleted_at ?? null
          )
        }
        for (const c of cards) {
          stmtUpsertCard.run(
            c.id, c.deck_id,
            c.front.text, c.front.type,
            c.back.text,  c.back.type,
            JSON.stringify(c.tags ?? []),
            c.due, c.stability, c.difficulty,
            c.elapsed_days, c.scheduled_days,
            c.reps, c.lapses, c.state,
            c.last_review ?? null,
            c.is_suspended ? 1 : 0,
            c.created_at, c.updated_at, c.deleted_at ?? null
          )
        }
        for (const l of review_logs) {
          stmtInsertLog.run(
            l.id, l.card_id, l.deck_id, l.rating, l.state, l.due,
            l.stability, l.difficulty, l.elapsed_days, l.scheduled_days,
            l.review_duration_ms, l.reviewed_at
          )
        }
        stmtUpsertMeta.run(client_id, Date.now())
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }

      return { ok: true, server_time: Date.now() }
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ ok: false, error: String(err) })
    }
  })

  // GET /sync/pull
  app.get<{ Querystring: { since?: string; client_id?: string } }>('/sync/pull', async (req, reply) => {
    const since     = Number(req.query.since ?? 0)
    const client_id = req.query.client_id ?? ''
    if (!client_id) return reply.status(400).send({ ok: false, error: 'missing client_id' })

    const decks = (db.prepare(
      'SELECT * FROM decks WHERE updated_at > ? ORDER BY updated_at ASC'
    ).all(since) as Record<string, unknown>[]).map(rowToDeck)

    const cards = (db.prepare(
      'SELECT * FROM cards WHERE updated_at > ? ORDER BY updated_at ASC'
    ).all(since) as Record<string, unknown>[]).map(rowToCard)

    const review_logs = db.prepare(
      'SELECT * FROM review_logs WHERE reviewed_at > ? ORDER BY reviewed_at ASC'
    ).all(since)

    return { decks, cards, review_logs, server_time: Date.now() }
  })

  // GET /sync/status
  app.get('/sync/status', async () => {
    const { total_decks } = db.prepare(
      'SELECT COUNT(*) as total_decks FROM decks WHERE deleted_at IS NULL'
    ).get() as { total_decks: number }

    const { total_cards } = db.prepare(
      'SELECT COUNT(*) as total_cards FROM cards WHERE deleted_at IS NULL'
    ).get() as { total_cards: number }

    return { ok: true, total_decks, total_cards, server_time: Date.now() }
  })
}
