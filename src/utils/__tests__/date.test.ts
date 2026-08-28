import { describe, test, expect } from 'vitest'
import { calcStreak, formatShortDate } from '../date'

describe('calcStreak', () => {
  const day = 86400000

  function todayStart() {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime()
  }

  test('无记录返回 0', () => {
    expect(calcStreak([])).toBe(0)
  })

  test('只有今天返回 1', () => {
    expect(calcStreak([todayStart()])).toBe(1)
  })

  test('今天+昨天返回 2', () => {
    const t = todayStart()
    expect(calcStreak([t, t - day])).toBe(2)
  })

  test('连续5天返回 5', () => {
    const t = todayStart()
    const days = Array.from({ length: 5 }, (_, i) => t - i * day)
    expect(calcStreak(days)).toBe(5)
  })

  test('中断后只计最近连续段', () => {
    const t = todayStart()
    // 今天、昨天、3天前（断了）
    expect(calcStreak([t, t - day, t - 3 * day])).toBe(2)
  })

  test('最后一次超过昨天则返回 0', () => {
    const t = todayStart()
    expect(calcStreak([t - 2 * day])).toBe(0)
  })

  test('重复日期不影响计算', () => {
    const t = todayStart()
    expect(calcStreak([t, t, t - day, t - day])).toBe(2)
  })
})

describe('formatShortDate', () => {
  test('格式化为 M/D', () => {
    const d = new Date(2026, 0, 5) // 1月5日
    expect(formatShortDate(d.getTime())).toBe('1/5')
  })
})
