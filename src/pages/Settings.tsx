import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Download, Upload, ChevronRight, RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { db, ensureSettings } from '@/db'
import { useAppStore } from '@/store/useAppStore'
import { useSyncStore } from '@/sync'
import { checkStatus } from '@/sync/api'
import type { Settings as SettingsType } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

type Theme = 'light' | 'dark' | 'system'

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-200',
          checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}

function NumberRow({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - (value <= 50 ? 5 : 10)))}
          className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-base font-medium flex items-center justify-center">−</button>
        <span className="text-sm font-bold text-gray-900 dark:text-white w-10 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + (value < 50 ? 5 : 10)))}
          className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-base font-medium flex items-center justify-center">+</button>
      </div>
    </div>
  )
}

export function Settings() {
  const { theme, setTheme } = useAppStore()
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const { status, lastSyncAt, errorMsg, serverUrl, setServerUrl, triggerSync } = useSyncStore()
  const [urlInput, setUrlInput] = useState(serverUrl)
  const [testing, setTesting] = useState(false)

  useEffect(() => { ensureSettings().then(setSettings) }, [])
  useEffect(() => { setUrlInput(serverUrl) }, [serverUrl])

  async function handleTestConnection() {
    setTesting(true)
    const result = await checkStatus()
    setTesting(false)
    if (result?.ok) {
      toast.success(`服务器正常，共 ${result.total_cards} 张卡片`)
    } else {
      toast.error('无法连接服务器，请检查地址')
    }
  }

  // 同步状态显示配置
  const statusConfig = {
    idle:    { icon: <RefreshCw size={14} />,   text: '等待同步', color: 'text-gray-400' },
    syncing: { icon: <RefreshCw size={14} className="animate-spin" />, text: '同步中...', color: 'text-blue-500' },
    synced:  { icon: <CheckCircle size={14} />, text: '已同步', color: 'text-green-500' },
    error:   { icon: <AlertCircle size={14} />, text: '同步出错', color: 'text-red-500' },
    offline: { icon: <WifiOff size={14} />,     text: '服务器不可达', color: 'text-orange-500' },
  }
  const sc = statusConfig[status]

  function formatSyncTime(ts: number) {
    if (!ts) return '从未同步'
    const diff = Date.now() - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return new Date(ts).toLocaleDateString('zh-CN')
  }

  async function save(patch: Partial<SettingsType>) {
    if (!settings) return
    const updated = { ...settings, ...patch, updated_at: Date.now() }
    setSettings(updated)
    await db.settings.put(updated)
  }

  async function handleExport() {
    try {
      const [decks, cards, logs] = await Promise.all([
        db.decks.toArray(), db.cards.toArray(), db.reviewLogs.toArray()
      ])
      const blob = new Blob([JSON.stringify({ version: 1, exported_at: Date.now(), decks, cards, review_logs: logs }, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url
      a.download = `flashmind-backup-${new Date().toISOString().slice(0,10)}.json`
      a.click(); URL.revokeObjectURL(url)
      toast.success('数据已导出')
    } catch { toast.error('导出失败') }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const json = JSON.parse(await file.text())
      if (!json.decks || !json.cards) { toast.error('文件格式不正确'); return }
      await db.transaction('rw', db.decks, db.cards, db.reviewLogs, async () => {
        await db.decks.bulkPut(json.decks)
        await db.cards.bulkPut(json.cards)
        if (json.review_logs?.length) await db.reviewLogs.bulkPut(json.review_logs)
      })
      toast.success(`已导入 ${json.decks.length} 个牌组，${json.cards.length} 张卡片`)
    } catch { toast.error('导入失败，文件可能已损坏') }
    e.target.value = ''
  }

  const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: '浅色', icon: <Sun size={16} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={16} /> },
    { value: 'dark',   label: '深色', icon: <Moon size={16} /> },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-20 px-5 pt-safe-top pb-3 pt-5 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">设置</h1>
      </header>

      <main className="flex-1 px-5 pb-24 space-y-5 mt-3">
        {/* 外观 */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">外观</p>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 p-4">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all',
                    theme === t.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8'
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 学习参数 */}
        {settings && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">学习参数</p>
            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 px-4 divide-y divide-gray-100 dark:divide-white/6">
              <NumberRow label="每日复习上限" value={settings.daily_review_limit} onChange={v => save({ daily_review_limit: v })} min={10} max={1000} />
              <NumberRow label="每日新卡上限" value={settings.daily_new_limit} onChange={v => save({ daily_new_limit: v })} min={1} max={100} />
            </div>
          </section>
        )}

        {/* 云端同步 */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">云端同步</p>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 p-4 space-y-4">
            {/* 服务器地址 */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">服务器地址</p>
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onBlur={() => setServerUrl(urlInput)}
                  placeholder="http://100.99.x.x:3002"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/12 transition-colors disabled:opacity-50"
                >
                  {testing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                  测试
                </button>
              </div>
            </div>

            {/* 状态行 */}
            <div className="flex items-center justify-between">
              <div className={cn('flex items-center gap-1.5 text-sm', sc.color)}>
                {sc.icon}
                <span>{sc.text}</span>
                {lastSyncAt > 0 && status !== 'syncing' && (
                  <span className="text-xs text-gray-400 ml-1">· {formatSyncTime(lastSyncAt)}</span>
                )}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400">{errorMsg}</p>
            )}

            {/* 立即同步按钮 */}
            <button
              onClick={() => triggerSync()}
              disabled={status === 'syncing'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={15} className={status === 'syncing' ? 'animate-spin' : ''} />
              {status === 'syncing' ? '同步中...' : '立即同步'}
            </button>
          </div>
        </section>

        {/* 数据管理 */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">数据管理</p>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-card dark:border dark:border-white/6 overflow-hidden">
            <button
              onClick={handleExport}
              className="flex items-center gap-3 w-full px-4 py-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Download size={18} className="text-primary-500 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-medium">导出数据</p>
                <p className="text-xs text-gray-400 mt-0.5">备份所有牌组和复习记录</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <div className="h-px bg-gray-100 dark:bg-white/6" />
            <label className="flex items-center gap-3 w-full px-4 py-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <Upload size={18} className="text-primary-500 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-medium">导入数据</p>
                <p className="text-xs text-gray-400 mt-0.5">从备份文件恢复，合并已有数据</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
              <input type="file" accept=".json" className="sr-only" onChange={handleImport} />
            </label>
          </div>
        </section>

        {/* 版本信息 */}
        <p className="text-center text-xs text-gray-400 pt-2">FlashMind v0.1.0 · 本地优先，数据完全在你的设备上</p>
      </main>
    </div>
  )
}
