import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LandingPage from './pages/LandingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AuthCallbackPage from './pages/AuthCallbackPage.jsx'
import GoogleAnalytics from './components/GoogleAnalytics.jsx'
import PageSeo from './components/PageSeo.jsx'

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
      <RouteSeo />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/demo" element={<ReviewPage isDemo />} />
          <Route path="/review/:businessId" element={<ReviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function RouteSeo() {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return (
      <PageSeo
        title="JustSay | Voice Reviews for Better Customer Feedback"
        description="Collect quick voice reviews and turn customer conversations into clear, actionable feedback with JustSay."
      />
    )
  }

  if (pathname === '/login') {
    return (
      <PageSeo
        title="Sign In or Sign Up | JustSay"
        description="Sign in or create a JustSay account to manage voice reviews for your business."
        noindex
      />
    )
  }

  if (pathname === '/dashboard') {
    return (
      <PageSeo
        title="Business Dashboard | JustSay"
        description="Manage voice reviews, customer sentiment, ratings, and review links in your JustSay dashboard."
        noindex
      />
    )
  }

  if (pathname.startsWith('/review/')) {
    return (
      <PageSeo
        title="Leave a Voice Review | JustSay"
        description="Share quick voice feedback with this business through JustSay."
        noindex
      />
    )
  }

  if (pathname === '/demo') {
    return (
      <PageSeo
        title="Try a Voice Review | JustSay"
        description="Try JustSay's voice review experience without creating an account."
        noindex
      />
    )
  }

  return (
    <PageSeo
      title="404 | Page Not Found | JustSay"
      description="The JustSay page you requested could not be found."
      noindex
    />
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
