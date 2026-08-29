// @ts-ignore — node:sqlite 是 Node 22.5+ 实验性内置模块
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH   = resolve(__dirname, 'data', 'flashmind.db')

mkdirSync(resolve(__dirname, 'data'), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`PRAGMA journal_mode = WAL`)
db.exec(`PRAGMA foreign_keys = ON`)

db.exec(`
CREATE TABLE IF NOT EXISTS decks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  emoji       TEXT,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);

CREATE TABLE IF NOT EXISTS cards (
  id             TEXT PRIMARY KEY,
  deck_id        TEXT NOT NULL,
  front_text     TEXT NOT NULL,
  back_text      TEXT NOT NULL,
  front_type     TEXT NOT NULL DEFAULT 'text',
  back_type      TEXT NOT NULL DEFAULT 'text',
  tags           TEXT NOT NULL DEFAULT '[]',
  due            INTEGER NOT NULL DEFAULT 0,
  stability      REAL    NOT NULL DEFAULT 0,
  difficulty     REAL    NOT NULL DEFAULT 0,
  elapsed_days   INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  state          INTEGER NOT NULL DEFAULT 0,
  last_review    INTEGER,
  is_suspended   INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL,
  deleted_at     INTEGER
);

CREATE TABLE IF NOT EXISTS review_logs (
  id                 TEXT PRIMARY KEY,
  card_id            TEXT NOT NULL,
  deck_id            TEXT NOT NULL,
  rating             INTEGER NOT NULL,
  state              INTEGER NOT NULL,
  due                INTEGER NOT NULL,
  stability          REAL NOT NULL,
  difficulty         REAL NOT NULL,
  elapsed_days       INTEGER NOT NULL,
  scheduled_days     INTEGER NOT NULL,
  review_duration_ms INTEGER NOT NULL DEFAULT 0,
  reviewed_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  client_id    TEXT PRIMARY KEY,
  last_push_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_decks_updated_at        ON decks(updated_at);
CREATE INDEX IF NOT EXISTS idx_cards_updated_at        ON cards(updated_at);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id           ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_logs_reviewed_at        ON review_logs(reviewed_at);
`)

console.log(`SQLite ready: ${DB_PATH}`)
