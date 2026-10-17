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
          showToast('New review received!')
          onNewReview?.(newReview)

          setTimeout(() => {
            setNewReviewIds((prev) => {
              const next = new Set(prev)
              next.delete(newReview.id)
              return next
            })
          }, 5000)
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
          <div className="flex items-center gap-2 rounded-xl border border-accent-purple/30 bg-surface-card px-4 py-3 shadow-lg shadow-accent-purple/10">
            <div className="h-2 w-2 rounded-full bg-accent-purple animate-pulse" />
            <span className="text-sm font-medium text-white">{toast}</span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card/50 py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-gray-600" />
            <p className="text-sm font-medium text-gray-400">No reviews yet</p>
            <p className="mt-1 text-xs text-gray-600">
              Reviews will appear here in real-time
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
