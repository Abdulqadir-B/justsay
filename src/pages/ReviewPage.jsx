import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import { createClient } from '../lib/supabase.js'

export default function ReviewPage() {
  const { businessId } = useParams()

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

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const audioBase64 = btoa(binary)

      // Call Supabase Edge Function instead of Next.js API route
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke('process-review', {
        body: { audioBase64, mimeType, businessId },
      })

      if (error || !data?.success) {
        let errorMsg = data?.error || error?.message
        if (error && error.context) {
          try {
            const errBody = await error.context.json()
            if (errBody?.error) errorMsg = errBody.error
          } catch {
            // ignore
          }
        }
        throw new Error(errorMsg || 'Failed to submit review')
      }

      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong')
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-7 text-center">
        {/* Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-zinc-400">
            Customer Feedback
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Leave a review for <span className="text-zinc-100 underline decoration-zinc-700 underline-offset-4">{businessName}</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Tap the mic and speak for up to 5 seconds.
          </p>
        </div>

        {/* Voice Recorder Box */}
        <div className="w-full rounded-2xl border border-zinc-800/90 bg-[#121215] p-8 shadow-xl">
          <VoiceRecorder onSubmit={handleSubmit} isSubmitting={isSubmitting} />
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

        {/* Footer */}
        <p className="text-xs text-zinc-600">
          Powered by <span className="font-medium text-zinc-500">JustSay</span>
        </p>
      </div>
    </div>
  )
}
