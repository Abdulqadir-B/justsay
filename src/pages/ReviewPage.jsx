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
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-gray-500" />
          <h1 className="text-xl font-semibold text-white">Business not found</h1>
          <p className="text-sm text-gray-400 max-w-sm">
            The review link you followed doesn&apos;t match any registered business.
            Please check the link and try again.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
        <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sentiment-positive/10">
            <CheckCircle className="h-10 w-10 text-sentiment-positive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Thank you!</h1>
            <p className="mt-2 text-sm text-gray-400 max-w-xs">
              Your feedback helps <span className="font-semibold text-white">{businessName}</span> improve.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-accent-purple uppercase tracking-wider">Voice Review</p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Leave a review for{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {businessName}
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Tap the mic and speak for up to 5 seconds
          </p>
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {/* Submit error */}
        {submitError && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center animate-fade-in">
            <p className="text-sm text-red-400">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="mt-2 text-xs font-medium text-red-300 underline hover:text-red-200"
              aria-label="Dismiss error and try again"
            >
              Try again
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-600">
          Powered by <span className="font-semibold text-gray-500">JustSay</span>
        </p>
      </div>
    </div>
  )
}
