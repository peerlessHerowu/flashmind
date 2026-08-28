import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/ui/BottomNav'

const Home       = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const DeckList   = lazy(() => import('./pages/DeckList').then(m => ({ default: m.DeckList })))
const DeckDetail = lazy(() => import('./pages/DeckDetail').then(m => ({ default: m.DeckDetail })))
const CardEditor = lazy(() => import('./pages/CardEditor').then(m => ({ default: m.CardEditor })))
const Review     = lazy(() => import('./pages/Review').then(m => ({ default: m.Review })))
const Stats      = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })))
const Settings   = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))

function TabLayout() {
  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>}>
        <Outlet />
      </Suspense>
      <BottomNav />
    </>
  )
}

function FullLayout() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <TabLayout />,
    children: [
      { path: '/',         element: <Home /> },
      { path: '/decks',    element: <DeckList /> },
      { path: '/deck/:id', element: <DeckDetail /> },
      { path: '/stats',    element: <Stats /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  {
    element: <FullLayout />,
    children: [
      { path: '/review',       element: <Review /> },
      { path: '/card/:id',     element: <CardEditor /> },
    ],
  },
])
