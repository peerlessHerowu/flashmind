import type { ClozeSegment } from '@/types'

// 匹配 {{c1::word}} 或 {{c1::word::hint}} 语法
const CLOZE_RE = /\{\{c(\d+)::([^}:]+)(?:::[^}]*)?\}\}/g

/**
 * 解析 Cloze 语法，返回 ClozeSegment 数组。
 * 示例: "The city was {{c1::abandoned}} after the flood."
 * → [text:"The city was ", blank:"abandoned"(1), text:" after the flood."]
 */
export function parseCloze(text: string): ClozeSegment[] {
  const segments: ClozeSegment[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(CLOZE_RE.source, 'g')

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', text: text.slice(last, m.index), index: 0 })
    }
    segments.push({ type: 'blank', text: m[2], index: Number(m[1]) })
    last = m.index + m[0].length
  }

  if (last < text.length) {
    segments.push({ type: 'text', text: text.slice(last), index: 0 })
  }

  return segments
}

/**
 * 校验字符串是否包含至少一个有效的 Cloze 标记（{{c1::...}}）
 */
export function isValidCloze(text: string): boolean {
  return /\{\{c\d+::[^}:]+\}\}/.test(text)
}

/**
 * 将 Cloze 文本还原为普通文本（用于搜索/展示）
 * "The city was {{c1::abandoned}} after the flood." → "The city was abandoned after the flood."
 */
export function clozeToPlainText(text: string): string {
  return text.replace(/\{\{c\d+::([^}:]+)(?:::[^}]*)?\}\}/g, '$1')
}

// Self-check（开发时启用）
// console.assert(parseCloze('Hello {{c1::world}}').length === 3)
// console.assert(isValidCloze('{{c1::test}}') === true)
// console.assert(isValidCloze('no cloze') === false)
// console.assert(clozeToPlainText('The {{c1::cat}} sat on the {{c2::mat}}') === 'The cat sat on the mat')
