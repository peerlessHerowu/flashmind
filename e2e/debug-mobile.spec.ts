import { test, expect } from '@playwright/test'

test('mobile dev: 抓取白屏错误', async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
  })
  const page = await ctx.newPage()
  const errors: string[] = []
  const consoleLogs: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push(msg.text())
    if (msg.type() === 'warning') consoleLogs.push('[WARN] ' + msg.text())
  })

  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'test-results/mobile-dev-5173.png', fullPage: true })

  const body = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')
  console.log('=== dev(5173) pageerrors:', JSON.stringify(errors))
  console.log('=== dev(5173) console.error:', JSON.stringify(consoleLogs))
  console.log('=== dev(5173) body:', body.slice(0, 200))
  await ctx.close()
})

test('mobile build: 抓取白屏错误', async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
  })
  const page = await ctx.newPage()
  const errors: string[] = []
  const consoleLogs: string[] = []
  page.on('pageerror', e => errors.push(e.stack ?? e.message))
  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push(msg.text())
  })

  await page.goto('http://localhost:5174/')
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'test-results/mobile-build-5174.png', fullPage: true })

  const body = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')
  console.log('=== build(5174) pageerrors:', JSON.stringify(errors))
  console.log('=== build(5174) console.error:', JSON.stringify(consoleLogs))
  console.log('=== build(5174) body:', body.slice(0, 200))
  await ctx.close()
})
