import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LandingPage from './pages/LandingPage.jsx'
import GoogleAnalytics from './components/GoogleAnalytics.jsx'

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'))

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
      Loading JustSay...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteAnalytics />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/review/:businessId" element={<ReviewPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function RouteAnalytics() {
  const location = useLocation()
  const isReviewPage = location.pathname.startsWith('/review/')

  return (
    <>
      {!isReviewPage && <GoogleAnalytics />}
      {!isReviewPage && <Analytics />}
    </>
  )
}
