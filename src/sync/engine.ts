import { db } from '@/db'
import { pushChanges, pullChanges } from './api'
import type { Deck, Card, ReviewLog } from '@/types'
import { uuid } from '@/utils/uuid'

// ── 持久化 client_id 和 last_sync_at ──────────────────────────────────────────

export function getClientId(): string {
  let id = localStorage.getItem('flashmind_client_id')
  if (!id) {
    id = uuid()
    localStorage.setItem('flashmind_client_id', id)
  }
  return id
}

export function getLastSyncAt(): number {
  return Number(localStorage.getItem('flashmind_last_sync_at') ?? 0)
}

export function setLastSyncAt(t: number) {
  localStorage.setItem('flashmind_last_sync_at', String(t))
}

// ── 防抖同步 ───────────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleSyncDebounced() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { sync().catch(() => {}) }, 5000)
}

// ── 推送本地变更 ───────────────────────────────────────────────────────────────

async function push(since: number): Promise<number | null> {
  const clientId = getClientId()

  // 查询自 since 以来有变更的数据
  const decks = await db.decks
    .filter(d => d.updated_at > since)
    .toArray()

  const cards = await db.cards
    .filter(c => c.updated_at > since)
    .toArray()

  const reviewLogs = await db.reviewLogs
    .filter(l => l.reviewed_at > since)
    .toArray()

  if (!decks.length && !cards.length && !reviewLogs.length) return Date.now()

  const result = await pushChanges({ client_id: clientId, decks, cards, review_logs: reviewLogs })
  return result?.server_time ?? null
}

// ── 拉取服务端变更 ─────────────────────────────────────────────────────────────

async function pull(since: number): Promise<number | null> {
  const clientId = getClientId()
  const result = await pullChanges(since, clientId)
  if (!result) return null

  // 合并 decks
  if (result.decks.length) {
    const toDelete = result.decks.filter(d => d.deleted_at).map(d => d.id)
    const toUpsert = result.decks.filter(d => !d.deleted_at)
    if (toDelete.length) await db.decks.bulkDelete(toDelete)
    if (toUpsert.length) await db.decks.bulkPut(toUpsert)
  }

  // 合并 cards
  if (result.cards.length) {
    const toDelete = result.cards.filter(c => c.deleted_at).map(c => c.id)
    const toUpsert = result.cards.filter(c => !c.deleted_at)
    if (toDelete.length) await db.cards.bulkDelete(toDelete)
    if (toUpsert.length) await db.cards.bulkPut(toUpsert)
  }

  // 合并 review_logs（只增不改）
  if (result.review_logs.length) {
    await db.reviewLogs.bulkPut(result.review_logs as ReviewLog[])
  }

  return result.server_time
}

// ── 主同步函数（push → pull） ──────────────────────────────────────────────────

let isSyncing = false

export async function sync(): Promise<'ok' | 'offline' | 'error'> {
  if (isSyncing) return 'ok'
  isSyncing = true

  try {
    const since = getLastSyncAt()

    const pushTime = await push(since)
    if (pushTime === null) return 'offline'

    const pullTime = await pull(since)
    if (pullTime === null) return 'offline'

    setLastSyncAt(Math.max(pushTime, pullTime))
    return 'ok'
  } catch (e) {
    console.error('[sync] error:', e)
    ;(window as any).__lastSyncError = String(e)
    return 'error'
  } finally {
    isSyncing = false
  }
}
