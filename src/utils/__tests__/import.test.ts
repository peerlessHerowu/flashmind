import { describe, test, expect } from 'vitest'
import { parseCSV } from '../import'

describe('parseCSV', () => {
  test('标准格式正确解析', () => {
    const csv = `front,back\nephemeral,短暂的\nubiquitous,无处不在的`
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ front: 'ephemeral', back: '短暂的', tags: [] })
    expect(result.rows[1]).toEqual({ front: 'ubiquitous', back: '无处不在的', tags: [] })
    expect(result.errors).toHaveLength(0)
  })

  test('含 tags 列正确解析', () => {
    const csv = `front,back,tags\nword,释义,英语;CET-6`
    const result = parseCSV(csv)
    expect(result.rows[0].tags).toEqual(['英语', 'CET-6'])
  })

  test('缺少 back 列时返回错误', () => {
    const csv = `front\nephemeral`
    const result = parseCSV(csv)
    expect(result.errors).toContain('缺少必需的 back 列')
    expect(result.rows).toHaveLength(0)
  })

  test('缺少 front 列时返回错误', () => {
    const csv = `word,back\nhello,你好`
    const result = parseCSV(csv)
    expect(result.errors).toContain('缺少必需的 front 列')
  })

  test('空行被跳过', () => {
    const csv = `front,back\nephemeral,短暂的\n\n\nword,词`
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(2)
  })

  test('front 重复的行进入 duplicates，不报 error', () => {
    const csv = `front,back\nephemeral,短暂的\nephemeral,另一个意思`
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.duplicates).toContain('ephemeral')
    expect(result.errors).toHaveLength(0)
  })

  test('back 为空时报错并跳过', () => {
    const csv = `front,back\nhello,`
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('空文件返回错误', () => {
    const result = parseCSV('')
    expect(result.errors).toContain('文件为空')
  })

  test('去掉 BOM 头正常解析', () => {
    const csv = `\uFEFFfront,back\nhello,你好`
    const result = parseCSV(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].front).toBe('hello')
  })

  test('双引号包裹的字段正确解析', () => {
    const csv = `front,back\n"hello, world",你好世界`
    const result = parseCSV(csv)
    expect(result.rows[0].front).toBe('hello, world')
  })
})
