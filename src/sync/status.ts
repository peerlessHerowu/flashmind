import { create } from 'zustand'
import { sync, getLastSyncAt, setLastSyncAt } from './engine'
import { setSyncUrl, getSyncUrl } from './api'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

interface SyncStore {
  status: SyncStatus
  lastSyncAt: number
  errorMsg: string
  serverUrl: string

  setServerUrl: (url: string) => void
  triggerSync: () => Promise<void>
  init: () => void
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status:     'idle',
  lastSyncAt: getLastSyncAt(),
  errorMsg:   '',
  serverUrl:  getSyncUrl(),

  setServerUrl: (url) => {
    setSyncUrl(url)
    set({ serverUrl: url })
  },

  triggerSync: async () => {
    if (get().status === 'syncing') return
    set({ status: 'syncing', errorMsg: '' })
    const result = await sync()
    const now    = getLastSyncAt()
    if (result === 'ok') {
      set({ status: 'synced', lastSyncAt: now })
    } else if (result === 'offline') {
      set({ status: 'offline', errorMsg: '服务器不可达，数据已保存本地' })
    } else {
      set({ status: 'error', errorMsg: '同步出错，请稍后重试' })
    }
  },

  init: () => {
    // 初始读取 localStorage 里的值
    set({ lastSyncAt: getLastSyncAt(), serverUrl: getSyncUrl() })
  },
}))
