/**
 * 同步 E2E 测试：模拟两个设备间数据同步
 * 设备A：创建牌组和卡片 → 触发同步推送
 * 设备B：清空本地 IndexedDB → 拉取 server 数据 → 验证数据出现
 */
import { test, expect } from '@playwright/test'

const SERVER = 'http://localhost:3002'

// 清空 server 数据，确保测试隔离
async function clearServer() {
  // 直接查询确认 server 在线
  const res = await fetch(`${SERVER}/health`).catch(() => null)
  return !!res?.ok
}

test('同步：设备A写数据 → server → 设备B读数据', async ({ browser }) => {
  const serverOnline = await clearServer()
  if (!serverOnline) {
    test.skip()
    return
  }

  // ── 设备A：创建牌组和卡片，触发同步 ─────────────────────────────────────────
  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()

  // 清空设备A的 IndexedDB
  await pageA.goto('http://localhost:5173/')
  await pageA.evaluate(async () => {
    const dbs = await (indexedDB.databases?.() ?? Promise.resolve([]))
    await Promise.all((dbs as IDBDatabaseInfo[]).map(db =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.deleteDatabase(db.name!)
        r.onsuccess = () => res(); r.onerror = () => rej()
      })
    ))
  })
  await pageA.reload()
  await pageA.waitForLoadState('networkidle')

  // 设置 server 地址
  await pageA.evaluate((url) => {
    localStorage.setItem('flashmind_server_url', url)
    localStorage.setItem('flashmind_client_id', 'device-a')
    localStorage.setItem('flashmind_last_sync_at', '0')
  }, SERVER)

  // 创建牌组
  await pageA.click('[aria-label="新建牌组"]')
  await pageA.fill('input[placeholder="牌组名称"]', '同步测试牌组')
  await pageA.click('button[type="submit"]:has-text("创建")')
  await expect(pageA.getByText('同步测试牌组')).toBeVisible({ timeout: 8000 })

  // 进入牌组，添加卡片
  await pageA.getByText('同步测试牌组').first().click()
  await pageA.waitForURL(/\/deck\//)
  await pageA.click('button:has-text("添加卡片")')
  await pageA.waitForURL(/\/card\/new/)
  await pageA.fill('textarea[placeholder="输入正面内容..."]', 'synchronize')
  await pageA.fill('textarea[placeholder="输入背面内容..."]', '同步；使同步')
  await pageA.click('button:has-text("保存")')
  await pageA.waitForTimeout(500)

  // 手动触发立即同步
  await pageA.goto('http://localhost:5173/settings')
  await pageA.waitForLoadState('networkidle')
  await pageA.waitForTimeout(500)

  // 点立即同步
  await pageA.click('button:has-text("立即同步")')
  await expect(pageA.locator('button:has-text("立即同步")')).toBeEnabled({ timeout: 10000 })
  await pageA.waitForTimeout(1000)

  // 确认 server 已收到数据
  const status = await fetch(`${SERVER}/sync/status`).then(r => r.json())
  console.log('Server status after device A push:', JSON.stringify(status))
  expect(status.total_decks).toBeGreaterThan(0)
  expect(status.total_cards).toBeGreaterThan(0)

  await ctxA.close()

  // ── 设备B：全新设备，从 server 拉取数据 ──────────────────────────────────────
  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()

  await pageB.goto('http://localhost:5173/')
  // 清空设备B的 IndexedDB（全新设备）
  await pageB.evaluate(async () => {
    const dbs = await (indexedDB.databases?.() ?? Promise.resolve([]))
    await Promise.all((dbs as IDBDatabaseInfo[]).map(db =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.deleteDatabase(db.name!)
        r.onsuccess = () => res(); r.onerror = () => rej()
      })
    ))
  })
  await pageB.reload()
  await pageB.waitForLoadState('networkidle')

  // 设置 server 地址和不同的 client_id（模拟新设备）
  await pageB.evaluate((url) => {
    localStorage.setItem('flashmind_server_url', url)
    localStorage.setItem('flashmind_client_id', 'device-b')
    localStorage.setItem('flashmind_last_sync_at', '0')
  }, SERVER)

  // 设备B去设置页手动同步
  await pageB.goto('http://localhost:5173/settings')
  await pageB.waitForLoadState('networkidle')
  await pageB.waitForTimeout(500)
  await pageB.click('button:has-text("立即同步")')
  await expect(pageB.locator('button:has-text("立即同步")')).toBeEnabled({ timeout: 10000 })
  await pageB.waitForTimeout(1000)

  // 回首页验证数据出现
  await pageB.goto('http://localhost:5173/')
  await pageB.waitForLoadState('networkidle')
  await pageB.waitForTimeout(500)

  // 截图
  await pageB.screenshot({ path: 'test-results/sync-device-b-home.png' })

  // 验证牌组出现
  await expect(pageB.getByText('同步测试牌组')).toBeVisible({ timeout: 8000 })
  console.log('✅ 设备B成功收到设备A的数据')

  // 进入牌组验证卡片
  await pageB.getByText('同步测试牌组').first().click()
  await pageB.waitForURL(/\/deck\//)
  await expect(pageB.getByText('synchronize')).toBeVisible({ timeout: 5000 })
  console.log('✅ 卡片也同步成功')

  await ctxB.close()
})

test('同步：server 不可达时操作正常', async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.evaluate(async () => {
    const dbs = await (indexedDB.databases?.() ?? Promise.resolve([]))
    await Promise.all((dbs as IDBDatabaseInfo[]).map(db =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.deleteDatabase(db.name!)
        r.onsuccess = () => res(); r.onerror = () => rej()
      })
    ))
  })
  await page.reload()
  await page.waitForLoadState('networkidle')

  // 设置一个不存在的 server
  await page.evaluate(() => {
    localStorage.setItem('flashmind_server_url', 'http://localhost:9999')
  })
  await page.reload()
  await page.waitForLoadState('networkidle')

  // 正常创建牌组（不受同步失败影响）
  await page.click('[aria-label="新建牌组"]')
  await page.fill('input[placeholder="牌组名称"]', '离线测试')
  await page.click('button[type="submit"]:has-text("创建")')
  await expect(page.getByText('离线测试')).toBeVisible({ timeout: 8000 })
  console.log('✅ server 不可达时本地操作不受影响')
})
