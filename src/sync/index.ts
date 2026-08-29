import { useSyncStore } from './status'

export { useSyncStore } from './status'
export { scheduleSyncDebounced, getClientId, sync } from './engine'
export { checkStatus, getSyncUrl, setSyncUrl, pushChanges } from './api'

/** 初始化自动同步：启动时同步一次，切回前台时再同步 */
export function initAutoSync() {
  const { triggerSync } = useSyncStore.getState()

  // 启动时同步
  triggerSync().catch(() => {})

  // 切回前台时同步
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerSync().catch(() => {})
    }
  })
}
