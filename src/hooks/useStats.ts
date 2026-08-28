import { db } from '@/db'
import { startOfToday, daysAgo, formatShortDate, calcStreak } from '@/utils/date'
import { useLiveQuery } from 'dexie-react-hooks'

export interface DailyBar { date: string; count: number }

/** 今日复习总数 */
export function useTodayReviewCount() {
  return useLiveQuery(async () => {
    return db.reviewLogs
      .where('reviewed_at').aboveOrEqual(startOfToday())
      .count()
  }, [], 0)
}

/** 连续打卡天数 */
export function useStreak() {
  return useLiveQuery(async () => {
    const logs = await db.reviewLogs
      .where('reviewed_at').aboveOrEqual(daysAgo(365))
      .toArray()
    // 每条日志归到当天的 0:00
    const days = logs.map(l => {
      const d = new Date(l.reviewed_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    return calcStreak(days)
  }, [], 0)
}

/** 过去 N 天每日复习量 */
export function useDailyBars(days = 30): DailyBar[] {
  return useLiveQuery(async () => {
    const from = daysAgo(days - 1)
    const logs = await db.reviewLogs
      .where('reviewed_at').aboveOrEqual(from)
      .toArray()

    // 统计每天数量
    const map = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
      map.set(formatShortDate(d.getTime()), 0)
    }
    for (const log of logs) {
      const key = formatShortDate(log.reviewed_at)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
  }, [], []) as DailyBar[]
}

/** 总卡片数 */
export function useTotalCards() {
  return useLiveQuery(() => db.cards.count(), [], 0)
}
