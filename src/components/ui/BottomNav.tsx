import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/',         icon: Home,       label: '首页' },
  { to: '/decks',    icon: LayoutGrid, label: '牌组' },
  { to: '/stats',    icon: BarChart2,  label: '统计' },
  { to: '/settings', icon: Settings,   label: '设置' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-paper-200/80 dark:border-ink-800/80 bg-paper-50/95 dark:bg-ink-950/95 backdrop-blur-md pb-safe-bottom h-[60px]">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => cn(
            'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 min-w-[52px] rounded-lg transition-colors',
            isActive
              ? 'text-primary-500'
              : 'text-paper-500 dark:text-ink-400'
          )}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium mt-0.5">
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
