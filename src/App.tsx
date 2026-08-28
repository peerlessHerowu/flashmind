import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { useAppStore } from './store/useAppStore'
import { ensureSettings } from './db'
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt'

export default function App() {
  const { theme, setTheme } = useAppStore()

  // 启动时同步主题
  useEffect(() => {
    ensureSettings().then(s => setTheme(s.theme))
  }, [setTheme])

  // 应用主题
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = (e: MediaQueryList | MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark')
        else root.classList.remove('dark')
      }
      apply(mq)
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: 'var(--toast-bg, #1E1E2E)',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </>
  )
}
