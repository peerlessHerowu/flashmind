import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/',         icon: Home,        label: '首页' },
  { to: '/decks',    icon: LayoutGrid,  label: '牌组' },
  { to: '/stats',    icon: BarChart2,   label: '统计' },
  { to: '/settings', icon: Settings,    label: '设置' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 dark:border-white/8 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md pb-safe-bottom h-16">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
            isActive
              ? 'text-primary-500'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          )}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium', isActive ? 'opacity-100' : 'opacity-0')}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
