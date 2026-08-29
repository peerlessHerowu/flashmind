import type { Deck, Card, ReviewLog } from '@/types'

const DEFAULT_SERVER = 'http://localhost:3002'
const TIMEOUT_MS = 5000

export function getSyncUrl(): string {
  try {
    return localStorage.getItem('flashmind_server_url') || DEFAULT_SERVER
  } catch {
    return DEFAULT_SERVER
  }
}

export function setSyncUrl(url: string) {
  try {
    localStorage.setItem('flashmind_server_url', url.replace(/\/$/, ''))
  } catch { /* ignore */ }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch {
    clearTimeout(timer)
    return null
  }
}

export interface PushPayload {
  client_id: string
  decks: Deck[]
  cards: Card[]
  review_logs: ReviewLog[]
}

export interface PullResult {
  decks: Deck[]
  cards: Card[]
  review_logs: ReviewLog[]
  server_time: number
}

export interface StatusResult {
  ok: boolean
  total_decks: number
  total_cards: number
  server_time: number
}

export async function pushChanges(payload: PushPayload): Promise<{ ok: boolean; server_time: number } | null> {
  const res = await fetchWithTimeout(`${getSyncUrl()}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res?.ok) return null
  return res.json()
}

export async function pullChanges(since: number, clientId: string): Promise<PullResult | null> {
  const res = await fetchWithTimeout(
    `${getSyncUrl()}/sync/pull?since=${since}&client_id=${clientId}`
  )
  if (!res?.ok) return null
  return res.json()
}

export async function checkStatus(): Promise<StatusResult | null> {
  const res = await fetchWithTimeout(`${getSyncUrl()}/sync/status`)
  if (!res?.ok) return null
  return res.json()
}
