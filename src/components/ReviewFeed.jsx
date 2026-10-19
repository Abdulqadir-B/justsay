import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../lib/supabase.js'
import ReviewCard from './ReviewCard.jsx'
import { MessageSquare } from 'lucide-react'

export default function ReviewFeed({ businessId, initialReviews, onNewReview }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [newReviewIds, setNewReviewIds] = useState(new Set())
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`reviews-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const newReview = payload.new
          setReviews((prev) => [newReview, ...prev])
          setNewReviewIds((prev) => new Set(prev).add(newReview.id))
          showToast('New review received')
          onNewReview?.(newReview)

          setTimeout(() => {
            setNewReviewIds((prev) => {
              const next = new Set(prev)
              next.delete(newReview.id)
              return next
            })
          }, 4000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, showToast, onNewReview])

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 toast-enter">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 shadow-xl">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-zinc-100">{toast}</span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-850 bg-zinc-900/20 py-12 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">No reviews yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Customer reviews will stream here in real time.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isNew={newReviewIds.has(review.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
