import type { ImportResult, ImportRow } from '@/types'

/** 解析 CSV 文本，返回导入行列表 */
export function parseCSV(raw: string): ImportResult {
  const errors: string[] = []
  const duplicates: string[] = []
  const rows: ImportRow[] = []
  const seen = new Set<string>()

  // 去掉 BOM
  const text = raw.replace(/^\uFEFF/, '').trim()
  if (!text) {
    return { rows: [], duplicates: [], errors: ['文件为空'] }
  }

  const lines = text.split(/\r?\n/)
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())

  const frontIdx = header.indexOf('front')
  const backIdx  = header.indexOf('back')
  const tagsIdx  = header.indexOf('tags')

  if (frontIdx === -1) return { rows: [], duplicates: [], errors: ['缺少必需的 front 列'] }
  if (backIdx  === -1) return { rows: [], duplicates: [], errors: ['缺少必需的 back 列'] }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 简单 CSV 解析（处理双引号包裹的字段）
    const cols = parseCSVLine(line)
    const front = cols[frontIdx]?.trim() ?? ''
    const back  = cols[backIdx]?.trim()  ?? ''

    if (!front || !back) {
      errors.push(`第 ${i + 1} 行：front 或 back 为空，已跳过`)
      continue
    }

    if (seen.has(front)) {
      duplicates.push(front)
      continue
    }
    seen.add(front)

    const tagsRaw = tagsIdx >= 0 ? (cols[tagsIdx]?.trim() ?? '') : ''
    const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : []

    rows.push({ front, back, tags })
  }

  return { rows, duplicates, errors }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
