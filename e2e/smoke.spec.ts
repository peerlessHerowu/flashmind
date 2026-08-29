import { test, expect } from '@playwright/test'
import { createDeck, createDeckAndEnter, addCard } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const dbs = await (indexedDB.databases?.() ?? Promise.resolve([]))
    await Promise.all(
      (dbs as IDBDatabaseInfo[]).map(db =>
        new Promise<void>((res, rej) => {
          const r = indexedDB.deleteDatabase(db.name!)
          r.onsuccess = () => res()
          r.onerror   = () => rej()
        })
      )
    )
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
})

// ── 首页 ──────────────────────────────────────────────────────────────────────

test('首页：空状态显示引导文案', async ({ page }) => {
  await expect(page.getByText('还没有牌组')).toBeVisible()
  await expect(page.getByText('创建牌组')).toBeVisible()
})

test('首页：无卡片时复习按钮禁用', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: /开始复习|今日已完成/ })
  ).toBeDisabled()
})

// ── 牌组管理 ──────────────────────────────────────────────────────────────────

test('创建牌组 - 正常流程', async ({ page }) => {
  await createDeck(page, '英语词汇')
  // toast 出现说明写入成功
  await expect(page.getByText('牌组已创建')).toBeVisible()
})

test('创建牌组 - 名称为空时按钮禁用', async ({ page }) => {
  await page.click('[aria-label="新建牌组"]')
  await expect(
    page.locator('button[type="submit"]:has-text("创建")')
  ).toBeDisabled()
})

test('点击牌组进入详情页', async ({ page }) => {
  await createDeckAndEnter(page, '数学')
  await expect(page.getByText('还没有卡片')).toBeVisible()
})

// ── 卡片管理 ──────────────────────────────────────────────────────────────────

test('添加卡片后显示在列表', async ({ page }) => {
  await createDeckAndEnter(page, '卡片测试')
  await addCard(page, 'ephemeral', '短暂的')
  await expect(page.getByText('ephemeral')).toBeVisible({ timeout: 5000 })
})

test('卡片正面为空时保存按钮禁用', async ({ page }) => {
  await createDeckAndEnter(page, '测试2')
  await page.click('button:has-text("添加卡片")')
  await page.waitForURL(/\/card\/new/)
  await page.fill('textarea[placeholder="输入正面内容..."]', 'hello')
  // 背面为空，保存按钮禁用
  await expect(page.getByRole('button', { name: '保存' })).toBeDisabled()
})

test('搜索卡片实时过滤', async ({ page }) => {
  await createDeckAndEnter(page, '搜索测试')
  await addCard(page, 'apple', '苹果')
  await addCard(page, 'banana', '香蕉')

  await page.fill('input[placeholder="搜索卡片..."]', 'apple')
  await expect(page.getByText('apple')).toBeVisible()
  await expect(page.getByText('banana')).not.toBeVisible({ timeout: 2000 })
})

// ── 复习流程 ──────────────────────────────────────────────────────────────────

test('有新卡时首页开始复习按钮可用', async ({ page }) => {
  await createDeckAndEnter(page, '复习测试')
  await addCard(page, 'hello', '你好')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByRole('button', { name: '开始复习' })
  ).toBeEnabled({ timeout: 5000 })
})

test('复习页显示卡片正面', async ({ page }) => {
  await createDeckAndEnter(page, '复习2')
  await addCard(page, 'ephemeral', '短暂的')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '开始复习' }).click()
  await page.waitForURL(/\/review/, { timeout: 5000 })
  // 复习页一定有 ephemeral，用 first() 避免 strict mode
  await expect(page.getByText('ephemeral').first()).toBeVisible({ timeout: 5000 })
})

test('复习页点击卡片翻转显示背面和评分按钮', async ({ page }) => {
  await createDeckAndEnter(page, '翻转测试')
  await addCard(page, 'hello', '你好')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '开始复习' }).click()
  await page.waitForSelector('text=hello')

  // 点击卡片翻转
  await page.locator('[role="button"]').first().click()
  await page.waitForTimeout(500)

  await expect(page.getByText('你好')).toBeVisible({ timeout: 3000 })
  await expect(page.getByText('忘了')).toBeVisible()
  await expect(page.getByText('记得')).toBeVisible()
})

test('打分后进入完成页', async ({ page }) => {
  await createDeckAndEnter(page, '完成测试')
  await addCard(page, 'hi', '嗨')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '开始复习' }).click()
  await page.waitForSelector('text=hi')

  await page.locator('[role="button"]').first().click()
  await page.waitForSelector('text=记得', { timeout: 3000 })
  await page.getByText('记得').click()

  await expect(
    page.getByText('今日复习完成')
  ).toBeVisible({ timeout: 5000 })
})

test('完成页点击回首页', async ({ page }) => {
  await createDeckAndEnter(page, '回首页测试')
  await addCard(page, 'test', '测试')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '开始复习' }).click()
  await page.waitForSelector('text=test')
  await page.locator('[role="button"]').first().click()
  await page.waitForSelector('text=记得', { timeout: 3000 })
  await page.getByText('记得').click()
  await page.waitForSelector('text=今日复习完成', { timeout: 5000 })

  await page.getByRole('button', { name: '回首页' }).click()
  await expect(page).toHaveURL('/')
})

// ── 导航 ──────────────────────────────────────────────────────────────────────

test('底部导航：在各 Tab 间切换', async ({ page }) => {
  await page.click('a[href="/decks"]')
  await expect(page.getByRole('heading', { name: '我的牌组' })).toBeVisible()

  await page.click('a[href="/stats"]')
  await expect(page.getByRole('heading', { name: '学习统计' })).toBeVisible()

  await page.click('a[href="/settings"]')
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible()

  await page.click('a[href="/"]')
  await expect(page.getByRole('heading', { name: 'FlashMind' })).toBeVisible()
})

// ── 数据持久化 ────────────────────────────────────────────────────────────────

test('刷新页面后牌组数据仍然存在', async ({ page }) => {
  await createDeck(page, '持久化测试')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('持久化测试')).toBeVisible({ timeout: 5000 })
})

// ── 设置页 ────────────────────────────────────────────────────────────────────

test('设置页：三种主题切换按钮均可点击', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('浅色')).toBeVisible()
  await expect(page.getByText('深色')).toBeVisible()
  await expect(page.getByText('跟随系统')).toBeVisible()

  await page.getByText('深色').click()
  // 检查 html 是否加了 dark class
  const hasDark = await page.evaluate(
    () => document.documentElement.classList.contains('dark')
  )
  expect(hasDark).toBe(true)
})
