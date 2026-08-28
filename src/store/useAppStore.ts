import { create } from 'zustand'
import type { ReviewSession } from '@/types'

interface AppState {
  // 主题
  theme: 'light' | 'dark' | 'system'
  setTheme: (t: 'light' | 'dark' | 'system') => void

  // 当前复习会话（临时内存态）
  session: ReviewSession | null
  setSession: (s: ReviewSession | null) => void
  updateSession: (s: Partial<ReviewSession>) => void

  // 今日统计缓存（避免重复查 DB）
  todayCount: number
  setTodayCount: (n: number) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  session: null,
  setSession: (session) => set({ session }),
  updateSession: (partial) => {
    const s = get().session
    if (s) set({ session: { ...s, ...partial } })
  },

  todayCount: 0,
  setTodayCount: (n) => set({ todayCount: n }),
}))
