import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, Eye, ShieldCheck, Star } from 'lucide-react'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import SentimentBadge from '../components/SentimentBadge.jsx'
import { createClient } from '../lib/supabase.js'

const DEMO_BUSINESS_ID = '00000000-0000-4000-8000-000000000001'

export default function ReviewPage({ isDemo = false }) {
  const { businessId } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const resolvedBusinessId = isDemo ? DEMO_BUSINESS_ID : businessId

  const [businessName, setBusinessName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('public_businesses')
          .select('name')
          .eq('id', resolvedBusinessId)
          .maybeSingle()

        if (error || !data) {
          setNotFound(true)
        } else {
          setBusinessName(data.name)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBusiness()
  }, [resolvedBusinessId])

  const handleSubmit = useCallback(async (audioBlob, mimeType) => {
    setIsSubmitting(true)
    setSubmitError(null)

    const tStart = performance.now()
    try {
      // Convert blob to base64 using native browser FileReader (fast and non-blocking)
      const tEncodeStart = performance.now()
      const audioBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const res = reader.result
          const base64 = typeof res === 'string' ? res.split(',')[1] : ''
          resolve(base64)
        }
        reader.onerror = () => reject(new Error('Failed to encode audio'))
        reader.readAsDataURL(audioBlob)
      })
      const encodeTimeMs = (performance.now() - tEncodeStart).toFixed(0)

      // Call Supabase Edge Function instead of Next.js API route
      const tCallStart = performance.now()
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke('process-review', {
        body: {
          audioBase64,
          mimeType,
          businessId: resolvedBusinessId,
          demo: isDemo,
        },
      })
      const callTimeSec = ((performance.now() - tCallStart) / 1000).toFixed(2)
      const totalTimeSec = ((performance.now() - tStart) / 1000).toFixed(2)

      if (import.meta.env.DEV) {
        const latencyMessage =
          `[VoiceReview Latency Profile] Total: ${totalTimeSec}s (Client Encode: ${encodeTimeMs}ms, Network+Server: ${callTimeSec}s)`
        console.log(latencyMessage)
        if (data?.timings) {
          console.log('[VoiceReview Server Timings]', data.timings)
        }
      }

      if (error || !data?.success) {
        let technicalMsg = data?.error || error?.message
        if (error && error.context) {
          try {
            const errBody = await error.context.json()
            if (errBody?.error) technicalMsg = errBody.error
            if (errBody?.attempts) {
              if (import.meta.env.DEV) {
                console.warn('[VoiceReview] Server model attempts diagnostics:', errBody.attempts)
              }
            }
          } catch {
            // ignore
          }
        }
        if (import.meta.env.DEV) {
          console.error('[VoiceReview] Edge function error detail:', technicalMsg, error)
        }
        throw new Error(technicalMsg || 'Failed to submit review')
      }

      if (isDemo) {
        setAnalysisResult(data.analysis)
      }
      setSubmitted(true)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[VoiceReview] Submission error:', err)
      }
      let userFriendlyMessage = "We couldn't process your voice note right now. Please tap 'Try again'."
      const msg = (err?.message || '').toLowerCase()

      if (msg.includes('business not found')) {
        userFriendlyMessage = 'This review link is invalid or no longer active.'
      } else if (msg.includes('too many review submissions')) {
        userFriendlyMessage = 'Too many submissions from this connection. Please try again later.'
      } else if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
        userFriendlyMessage = 'Connection issue. Please check your internet and try again.'
      }

      setSubmitError(userFriendlyMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isDemo, resolvedBusinessId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm rounded-xl border border-zinc-800 bg-[#121215] p-8">
          <AlertCircle className="h-10 w-10 text-zinc-500" />
          <h1 className="text-base font-semibold text-white">Business not found</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The review link you followed doesn&apos;t match any registered business. Please verify the URL.
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white underline underline-offset-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    if (isDemo && analysisResult) {
      const scorePercent = Math.round((analysisResult.sentiment_score ?? 0) * 100)

      return (
        <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:py-16">
          <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Your JustSay result</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Here&apos;s what JustSay understood</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Your voice was turned into structured customer insight in seconds.</p>
            </div>

            <section className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-5 shadow-xl sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SentimentBadge sentiment={analysisResult.sentiment} />
                <div className="flex items-center gap-1" aria-label={`${analysisResult.star_rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= analysisResult.star_rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-zinc-500">{analysisResult.star_rating}/5</span>
                </div>
              </div>

              <blockquote className="mt-5 border-l-2 border-emerald-400/50 pl-4 text-sm leading-7 text-zinc-200">
                &ldquo;{analysisResult.transcript}&rdquo;
              </blockquote>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-5">
                <div>
                  <p className="text-xs text-zinc-500">Sentiment match</p>
                  <p className="mt-1 text-lg font-semibold text-white">{scorePercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Key themes</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {analysisResult.keywords?.length > 0
                      ? analysisResult.keywords.map((keyword) => (
                        <span key={keyword} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                          {keyword}
                        </span>
                      ))
                      : <span className="text-sm text-zinc-400">None detected</span>}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => {
                  setAnalysisResult(null)
                  setSubmitted(false)
                }}
                className="btn-secondary px-5 py-3"
              >
                Try another review
              </button>
              <Link to="/login" className="btn-primary px-5 py-3">
                Create your review link
              </Link>
            </div>

            <Link to="/" className="mx-auto inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
              <ArrowLeft className="h-3 w-3" />
              Back to JustSay
            </Link>
          </main>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in max-w-sm rounded-xl border border-zinc-800 bg-[#121215] p-8 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Thank you!</h1>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              {isDemo
                ? 'You just experienced how a customer leaves feedback with JustSay.'
                : <>Your feedback was recorded for <span className="font-medium text-zinc-200">{businessName}</span>.</>}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Record another
            </button>
            {isDemo && (
              <>
                <span className="text-zinc-600">&bull;</span>
                <Link
                  to="/login"
                  className="text-xs text-zinc-300 hover:text-white underline"
                >
                  Create your review link
                </Link>
              </>
            )}
            {isPreview && (
              <>
                <span className="text-zinc-600">&bull;</span>
                <Link
                  to="/dashboard"
                  className="text-xs text-zinc-300 hover:text-white underline"
                >
                  Return to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Admin Preview Mode Header */}
      {isPreview && (
        <aside className="w-full bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-300 sticky top-0 z-50 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-medium text-zinc-200">Admin Preview Mode</span>
              <span className="hidden sm:inline text-zinc-500">— Test how customers experience your review link</span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-zinc-200 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Dashboard
            </Link>
          </div>
        </aside>
      )}

      {/* Main Review Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-md flex-col items-center gap-7 text-center">
          {/* Header */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isDemo ? 'JustSay Demo' : 'Verified Business'}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {isDemo ? 'Try a voice review with JustSay' : <>Leave a voice review for <span className="text-zinc-100 underline decoration-zinc-700 underline-offset-4">{businessName}</span></>}
            </h1>
            <p className="text-xs text-zinc-400">
              {isDemo
                ? 'Record a quick message to see how JustSay turns voice feedback into useful insight.'
                : 'Tap the microphone and speak for up to 15 seconds.'}
            </p>
          </div>

          {/* Voice Recorder Card */}
          <div className="w-full rounded-2xl border border-zinc-800/90 bg-[#121215] p-6 sm:p-8 shadow-xl">
            <VoiceRecorder onSubmit={handleSubmit} isSubmitting={isSubmitting} />

            {/* Quick 3-Step Micro Guide */}
            {!isSubmitting && (
              <div className="mt-6 pt-5 border-t border-zinc-850 flex items-center justify-around text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">1</span>
                  Tap mic
                </span>
                <span className="text-zinc-700">&bull;</span>
                <span className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">2</span>
                  Speak (up to 15s)
                </span>
                <span className="text-zinc-700">&bull;</span>
                <span className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">3</span>
                  Submit
                </span>
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center animate-fade-in">
              <p className="text-xs text-rose-300">{submitError}</p>
              <button
                onClick={() => setSubmitError(null)}
                className="mt-1.5 text-xs font-medium text-rose-400 underline hover:text-rose-300"
                aria-label="Dismiss error and try again"
              >
                Try again
              </button>
            </div>
          )}

          {/* Clean Footer Navigation */}
          <div className="flex items-center justify-center w-full pt-4 border-t border-zinc-900 text-xs text-zinc-600">
            <span>Powered by <span className="text-zinc-500 font-medium">JustSay</span></span>
          </div>
        </div>
      </main>
    </div>
  )
}
