import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '../lib/supabase.js'
import {
  AudioLines, LogOut, MessageSquare, TrendingUp, Star,
  Loader2, Link, Copy, Check,
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import ReviewFeed from '../components/ReviewFeed.jsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

function getReviewsPerDay(reviews) {
  const now = new Date()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dateKey = date.toISOString().split('T')[0]

    const count = reviews.filter((r) => {
      const reviewDate = new Date(r.created_at).toISOString().split('T')[0]
      return reviewDate === dateKey
    }).length

    days.push({ day: dayStr, reviews: count })
  }

  return days
}

function calculateStats(reviews) {
  if (reviews.length === 0) {
    return { totalReviews: 0, averageSentimentScore: 0, averageStarRating: 0 }
  }

  const totalReviews = reviews.length
  const averageSentimentScore =
    reviews.reduce((sum, r) => sum + r.sentiment_score, 0) / totalReviews
  const averageStarRating =
    reviews.reduce((sum, r) => sum + r.star_rating, 0) / totalReviews

  return { totalReviews, averageSentimentScore, averageStarRating }
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="text-sm font-bold text-accent-purple">
          {payload[0].value} review{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

// ── Onboarding ───────────────────────────────────────────────────────────────
function OnboardingCard({ userEmail, onCreated }) {
  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    if (!businessName.trim()) return
    setSaving(true)
    setErr(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('businesses')
        .insert({ name: businessName.trim(), owner_email: userEmail })
        .select()
        .single()
      if (error) { setErr(error.message); return }
      onCreated(data)
    } catch {
      setErr('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10 border border-accent-purple/20">
            <AudioLines className="h-8 w-8 text-accent-purple" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Welcome to JustSay</h1>
            <p className="mt-1 text-sm text-gray-500">Let&apos;s set up your business profile to get started.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-400 mb-1.5">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sunrise Coffee Co."
                required
                autoFocus
                className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
              <p className="mt-1.5 text-xs text-gray-600">Registered as: {userEmail}</p>
            </div>

            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="w-full rounded-xl bg-accent-purple px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-surface-card disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create My Business'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [noBusinessFound, setNoBusinessFound] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }
        setUserEmail(user.email ?? '')

        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_email', user.email)
          .maybeSingle()

        if (bizError) {
          console.error('Error fetching business:', bizError)
        }

        if (!bizData) {
          setNoBusinessFound(true)
          setLoading(false)
          return
        }

        setBusiness(bizData)

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', bizData.id)
          .order('created_at', { ascending: false })
          .limit(20)

        setReviews(reviewsData ?? [])
      } catch {
        console.error('Dashboard load error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate('/login')
  }, [navigate])

  const handleNewReview = useCallback((review) => {
    setReviews((prev) => [review, ...prev.filter(r => r.id !== review.id)])
  }, [])

  const stats = useMemo(() => calculateStats(reviews), [reviews])
  const chartData = useMemo(() => getReviewsPerDay(reviews), [reviews])

  const reviewUrl = business
    ? `${window.location.origin}/review/${business.id}`
    : ''

  const handleCopy = useCallback(() => {
    if (!reviewUrl) return
    navigator.clipboard.writeText(reviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [reviewUrl])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (noBusinessFound) {
    return (
      <OnboardingCard
        userEmail={userEmail}
        onCreated={(b) => {
          setBusiness(b)
          setNoBusinessFound(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/10 border border-accent-purple/20">
              <AudioLines className="h-4 w-4 text-accent-purple" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">JustSay</h1>
              {business && (
                <p className="text-xs text-gray-500">{business.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-sm text-gray-400 transition-all hover:bg-surface-elevated hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-purple"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Review Link Banner */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent-purple/20 bg-accent-purple/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-purple/15 border border-accent-purple/20">
              <Link className="h-4 w-4 text-accent-purple" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 mb-0.5">Your Customer Review Link</p>
              <p className="truncate text-sm font-mono text-gray-300">{reviewUrl}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-xs font-medium text-gray-400 transition-all hover:text-white hover:bg-surface-elevated"
            >
              Open
            </a>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                copied
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                  : 'bg-accent-purple text-white hover:bg-accent-indigo'
              }`}
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5" /> Copied!</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy Link</>
              )}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Reviews"
            value={stats.totalReviews.toString()}
            subtitle="all time"
            icon={<MessageSquare className="h-4 w-4" />}
            accentColor="text-accent-blue"
          />
          <StatCard
            title="Average Sentiment"
            value={`${Math.round(stats.averageSentimentScore * 100)} / 100`}
            subtitle="sentiment score"
            icon={<TrendingUp className="h-4 w-4" />}
            accentColor="text-sentiment-positive"
          />
          <StatCard
            title="Average Rating"
            value={`★ ${stats.averageStarRating.toFixed(1)}`}
            subtitle="out of 5 stars"
            icon={<Star className="h-4 w-4" />}
            accentColor="text-amber-400"
          />
        </div>

        {/* Chart */}
        <div className="mt-6 rounded-2xl border border-surface-border bg-surface-card p-6">
          <h2 className="mb-4 text-sm font-medium text-gray-400">Reviews — Last 7 Days</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2a2a3a"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  width={30}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                />
                <Bar
                  dataKey="reviews"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Feed */}
        <div className="mt-6">
          <h2 className="mb-4 text-sm font-medium text-gray-400">Recent Reviews</h2>
          {business && (
            <ReviewFeed
              businessId={business.id}
              initialReviews={reviews}
              onNewReview={handleNewReview}
            />
          )}
        </div>
      </main>
    </div>
  )
}
