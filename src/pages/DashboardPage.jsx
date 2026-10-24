import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '../lib/supabase.js'
import {
  MessageSquare, TrendingUp, Star,
  Loader2, Link as LinkIcon, Copy, Check, ExternalLink,
  Search, X, ArrowUpDown, QrCode, Download
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import BrandLogo from '../components/BrandLogo.jsx'
import StatCard from '../components/StatCard.jsx'
import ReviewFeed from '../components/ReviewFeed.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
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
    return {
      totalReviews: 0,
      averageSentimentScore: 0,
      averageStarRating: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
    }
  }

  const totalReviews = reviews.length
  const positiveCount = reviews.filter((r) => r.sentiment === 'positive').length
  const neutralCount = reviews.filter((r) => r.sentiment === 'neutral').length
  const negativeCount = reviews.filter((r) => r.sentiment === 'negative').length

  const averageSentimentScore =
    reviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) / totalReviews
  const averageStarRating =
    reviews.reduce((sum, r) => sum + (r.star_rating ?? 0), 0) / totalReviews

  return {
    totalReviews,
    averageSentimentScore,
    averageStarRating,
    positiveCount,
    neutralCount,
    negativeCount,
  }
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 shadow-xl">
        <p className="text-[11px] font-medium text-zinc-400">{label}</p>
        <p className="text-xs font-semibold text-zinc-100 mt-0.5">
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
      const { data: rateLimitData, error: rateLimitError } = await supabase.rpc(
        'consume_business_creation_limit'
      )

      if (rateLimitError) {
        setErr('Business setup is temporarily unavailable. Please try again.')
        return
      }

      if (!rateLimitData?.[0]?.allowed) {
        setErr('Too many setup attempts. Please try again later.')
        return
      }

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-3">
          <BrandLogo size="lg" showName={false} />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">Welcome to JustSay</h1>
            <p className="mt-1 text-xs text-zinc-400">Set up your business name to start collecting voice reviews.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-6 shadow-xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Coffee Co."
                required
                autoFocus
                className="input-subtle"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">Account: {userEmail}</p>
            </div>

            {err && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Business...
                </span>
              ) : (
                'Create Business Profile'
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
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'reviews' | 'share'
  const [reviewSearch, setReviewSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all') // 'all' | 'positive' | 'neutral' | 'negative'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'highest_rating' | 'lowest_rating' | 'highest_sentiment'

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
          .limit(100)

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
  const totalWeeklyReviews = useMemo(() => chartData.reduce((sum, d) => sum + d.reviews, 0), [chartData])

  const reviewUrl = business
    ? `${window.location.origin}/review/${business.id}`
    : ''

  const handleCopy = useCallback(() => {
    if (!reviewUrl) return
    navigator.clipboard.writeText(reviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [reviewUrl])

  const handleKeywordClick = useCallback((keyword) => {
    setReviewSearch(keyword)
    setActiveTab('reviews')
  }, [])

  // Filtered and sorted reviews for the dedicated Reviews tab
  const filteredReviews = useMemo(() => {
    let result = reviews.filter((r) => {
      const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter
      const text = `${r.transcript || ''} ${(r.keywords || []).join(' ')}`.toLowerCase()
      const matchesSearch = !reviewSearch.trim() || text.includes(reviewSearch.toLowerCase().trim())
      return matchesSentiment && matchesSearch
    })

    if (sortBy === 'highest_rating') {
      result.sort((a, b) => (b.star_rating ?? 0) - (a.star_rating ?? 0))
    } else if (sortBy === 'lowest_rating') {
      result.sort((a, b) => (a.star_rating ?? 0) - (b.star_rating ?? 0))
    } else if (sortBy === 'highest_sentiment') {
      result.sort((a, b) => (b.sentiment_score ?? 0) - (a.sentiment_score ?? 0))
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return result
  }, [reviews, sentimentFilter, reviewSearch, sortBy])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
          <p className="text-xs text-zinc-500">Loading your dashboard...</p>
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        business={business}
        userEmail={userEmail}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reviewCount={reviews.length}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 flex-1">

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Context-Aware Review Link Banner */}
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-[#121215] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <LinkIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">Customer Feedback URL</p>
                  <p className="truncate text-xs font-mono text-zinc-200 mt-0.5">{reviewUrl}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`${reviewUrl}?preview=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Test Link</span>
                </a>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                    copied
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-100 text-zinc-950 hover:bg-white'
                  }`}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                  )}
                </button>
              </div>
            </div>

            {/* Metric Stat Cards with Progress & Contextual Breakdowns */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Feedback"
                value={stats.totalReviews.toString()}
                badge={stats.totalReviews > 0 ? `${stats.positiveCount} positive` : null}
                subtitle={`${totalWeeklyReviews} received in the past 7 days`}
                icon={<MessageSquare className="h-4 w-4" />}
                progress={stats.totalReviews > 0 ? (stats.positiveCount / stats.totalReviews) * 100 : 0}
                progressColor="bg-emerald-500"
              />
              <StatCard
                title="Average Sentiment"
                value={`${Math.round(stats.averageSentimentScore * 100)} / 100`}
                badge={stats.averageSentimentScore >= 0.7 ? 'Strong positive' : stats.averageSentimentScore >= 0.4 ? 'Neutral' : 'Needs attention'}
                subtitle="speech transcription AI confidence"
                icon={<TrendingUp className="h-4 w-4" />}
                progress={Math.round(stats.averageSentimentScore * 100)}
                progressColor={stats.averageSentimentScore >= 0.7 ? 'bg-emerald-400' : 'bg-amber-400'}
              />
              <StatCard
                title="Average Rating"
                value={`★ ${stats.averageStarRating.toFixed(1)}`}
                badge="out of 5.0"
                subtitle={stats.totalReviews > 0 ? `From ${stats.totalReviews} verified voice reviews` : 'Awaiting initial reviews'}
                icon={<Star className="h-4 w-4" />}
                progress={(stats.averageStarRating / 5) * 100}
                progressColor="bg-amber-400"
              />
            </div>

            {/* 7-Day Chart */}
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-medium text-zinc-400">Activity &bull; Last 7 Days</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {totalWeeklyReviews > 0
                      ? `${totalWeeklyReviews} total review${totalWeeklyReviews > 1 ? 's' : ''} received this week`
                      : 'No reviews recorded in the last 7 days yet'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Daily volume</span>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="25%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222227"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      width={24}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    />
                    <Bar
                      dataKey="reviews"
                      fill="#e4e4e7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Live Feed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-medium text-zinc-400">Recent Customer Feed</h2>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  View all ({reviews.length}) &rarr;
                </button>
              </div>
              {business && (
                <ReviewFeed
                  businessId={business.id}
                  initialReviews={reviews.slice(0, 5)}
                  onNewReview={handleNewReview}
                  onKeywordClick={handleKeywordClick}
                />
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: REVIEWS (Dedicated Full View) ─── */}
        {activeTab === 'reviews' && (
          <div className="space-y-5">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white">All Feedback</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Showing {filteredReviews.length} of {reviews.length} customer responses
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Search keywords or text..."
                    className="w-48 sm:w-60 rounded-lg border border-zinc-800 bg-zinc-900/60 pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                  {reviewSearch && (
                    <button
                      onClick={() => setReviewSearch('')}
                      className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                      title="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sentiment Filter Segment */}
                <div className="flex items-center gap-1 bg-zinc-900/70 border border-zinc-800 rounded-lg p-0.5 text-xs">
                  {['all', 'positive', 'neutral', 'negative'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSentimentFilter(s)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                        sentimentFilter === s
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-lg border border-zinc-800 bg-zinc-900/70 pl-2.5 pr-7 py-1.5 text-[11px] text-zinc-300 focus:border-zinc-500 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest_rating">Highest Rated</option>
                    <option value="lowest_rating">Lowest Rated</option>
                    <option value="highest_sentiment">Highest Sentiment</option>
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-2 top-2 h-3 w-3 text-zinc-500" />
                </div>
              </div>
            </div>

            {/* Active Filters Bar if filtered */}
            {(reviewSearch || sentimentFilter !== 'all') && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Active filters:</span>
                {reviewSearch && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-200">
                    &ldquo;{reviewSearch}&rdquo;
                    <button onClick={() => setReviewSearch('')}>
                      <X className="h-3 w-3 hover:text-white" />
                    </button>
                  </span>
                )}
                {sentimentFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-200 capitalize">
                    {sentimentFilter}
                    <button onClick={() => setSentimentFilter('all')}>
                      <X className="h-3 w-3 hover:text-white" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setReviewSearch('')
                    setSentimentFilter('all')
                  }}
                  className="text-zinc-500 hover:text-zinc-300 underline ml-2"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Review Cards List */}
            {filteredReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-850 bg-zinc-900/20 py-16 text-center">
                <MessageSquare className="h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-400">No matching reviews</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Try adjusting your search query or sentiment filter.
                </p>
                {(reviewSearch || sentimentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setReviewSearch('')
                      setSentimentFilter('all')
                    }}
                    className="btn-secondary px-3 py-1.5 text-xs mt-3"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onKeywordClick={handleKeywordClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SHARE & LINK ─── */}
        {activeTab === 'share' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-lg font-semibold tracking-tight text-white">Share & Customer Collection</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Share this link or QR code with your customers to collect quick voice reviews.
              </p>
            </div>

            {/* Share Card */}
            <div className="rounded-xl border border-zinc-800 bg-[#121215] p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Direct Review URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={reviewUrl}
                    className="input-subtle font-mono text-xs flex-1 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className={`btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 ${
                      copied ? 'text-emerald-400 border-emerald-500/30' : ''
                    }`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`${reviewUrl}?preview=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-6">
                <div className="rounded-xl border border-zinc-800 bg-white p-3 shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(reviewUrl)}`}
                    alt="Review QR Code"
                    className="h-36 w-36"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2 justify-center sm:justify-start">
                    <QrCode className="h-4 w-4 text-zinc-400" />
                    Printable Table / Counter QR Code
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                    Print this QR code on receipts, table stands, or packaging. When scanned with any smartphone camera, customers are immediately taken to your voice recording page.
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(reviewUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download="justsay-qr.png"
                      className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download High-Res QR</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Tips for Collecting Voice Reviews
              </h4>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                <li>Tell customers it only takes a few seconds: <em>&ldquo;Just tap and say what you enjoyed!&rdquo;</em></li>
                <li>Voice reviews reduce friction by 80% compared to typing long forms.</li>
                <li>Sentiment and key highlights will automatically populate in your dashboard in real-time.</li>
              </ul>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
