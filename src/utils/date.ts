/** 今天 0:00:00 的 UTC 毫秒 */
export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 今天 23:59:59 的 UTC 毫秒 */
export function endOfToday(): number {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** N 天前 0:00 的 UTC 毫秒 */
export function daysAgo(n: number): number {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 格式化为 MM/DD */
export function formatShortDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 连续打卡天数计算 */
export function calcStreak(reviewedDays: number[]): number {
  if (reviewedDays.length === 0) return 0
  const sorted = [...new Set(reviewedDays)].sort((a, b) => b - a)
  const todayStart = startOfToday()
  const yesterdayStart = todayStart - 86400000

  // 最后一次复习必须是今天或昨天
  if (sorted[0] < yesterdayStart) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i - 1] - sorted[i]
    if (diff <= 86400000 + 1000) { // 允许 1 秒误差
      streak++
    } else {
      break
    }
  }
  return streak
}
