import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, Eye, ShieldCheck } from 'lucide-react'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import { createClient } from '../lib/supabase.js'

export default function ReviewPage() {
  const { businessId } = useParams()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  const [businessName, setBusinessName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', businessId)
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
  }, [businessId])

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
        body: { audioBase64, mimeType, businessId },
      })
      const callTimeSec = ((performance.now() - tCallStart) / 1000).toFixed(2)
      const totalTimeSec = ((performance.now() - tStart) / 1000).toFixed(2)

      console.log(
        `[VoiceReview Latency Profile] Total: ${totalTimeSec}s (Client Encode: ${encodeTimeMs}ms, Network+Server: ${callTimeSec}s)`,
        data?.timings
      )

      if (error || !data?.success) {
        let technicalMsg = data?.error || error?.message
        if (error && error.context) {
          try {
            const errBody = await error.context.json()
            if (errBody?.error) technicalMsg = errBody.error
            if (errBody?.attempts) {
              console.warn('[VoiceReview] Server model attempts diagnostics:', errBody.attempts)
            }
          } catch {
            // ignore
          }
        }
        console.error('[VoiceReview] Edge function error detail:', technicalMsg, error)
        throw new Error(technicalMsg || 'Failed to submit review')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('[VoiceReview] Submission error:', err)
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
  }, [businessId])

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
            to="/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white underline underline-offset-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in max-w-sm rounded-xl border border-zinc-800 bg-[#121215] p-8 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Thank you!</h1>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Your feedback was recorded for <span className="font-medium text-zinc-200">{businessName}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Record another
            </button>
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
              <span>Verified Business</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Leave a voice review for <span className="text-zinc-100 underline decoration-zinc-700 underline-offset-4">{businessName}</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Tap the microphone and speak for up to 15 seconds.
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
