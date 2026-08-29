import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** 创建牌组并等待出现在页面 */
export async function createDeck(page: Page, name: string) {
  await page.click('[aria-label="新建牌组"]')
  await page.fill('input[placeholder="牌组名称"]', name)
  await page.click('button[type="submit"]:has-text("创建")')
  // 等牌组名出现（Dexie useLiveQuery 响应式更新）
  await expect(page.getByText(name)).toBeVisible({ timeout: 8000 })
}

/** 进入牌组详情页（先创建） */
export async function createDeckAndEnter(page: Page, name: string) {
  await createDeck(page, name)
  // 点击牌组卡片
  await page.locator(`text=${name}`).first().click()
  await page.waitForURL(/\/deck\//)
}

/** 在当前卡片编辑页添加卡片 */
export async function addCard(page: Page, front: string, back: string) {
  await page.click('button:has-text("添加卡片")')
  await page.waitForURL(/\/card\/new/)
  await page.fill('textarea[placeholder="输入正面内容..."]', front)
  await page.fill('textarea[placeholder="输入背面内容..."]', back)
  await page.click('button:has-text("保存")')
  await page.waitForTimeout(400) // 等保存动画
  await page.goBack()
  await page.waitForLoadState('networkidle')
}
