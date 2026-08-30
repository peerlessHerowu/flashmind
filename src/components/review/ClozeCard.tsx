import { parseCloze } from '@/utils/cloze'
import { cn } from '@/utils/cn'

interface ClozeCardProps {
  text: string
  revealed: boolean
  onReveal: () => void
}

/**
 * Cloze 填空卡片渲染组件。
 * revealed=false：填空位置显示为可点击的下划线占位符
 * revealed=true：填空位置高亮显示实际答案
 */
export function ClozeCard({ text, revealed, onReveal }: ClozeCardProps) {
  const segments = parseCloze(text)

  return (
    <span
      className="text-2xl font-semibold text-paper-900 dark:text-white leading-relaxed"
      style={{ whiteSpace: 'pre-wrap' }}
    >
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.text}</span>
        }

        // blank 片段
        if (revealed) {
          return (
            <span
              key={i}
              className="inline-block rounded-md bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-1.5 py-0.5 font-bold"
            >
              {seg.text}
            </span>
          )
        }

        return (
          <button
            key={i}
            type="button"
            onClick={e => { e.stopPropagation(); onReveal() }}
            className={cn(
              'inline-block min-w-[3rem] border-b-2 border-paper-400 dark:border-ink-500',
              'text-transparent select-none cursor-pointer',
              'hover:border-primary-400 dark:hover:border-primary-400 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50'
            )}
            aria-label={`点击揭示第 ${seg.index} 个填空答案`}
          >
            {/* 用空格占位，让下划线宽度与答案等长 */}
            {'\u00a0'.repeat(Math.max(seg.text.length, 3))}
          </button>
        )
      })}
    </span>
  )
}
