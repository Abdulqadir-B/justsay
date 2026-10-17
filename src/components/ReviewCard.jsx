import { Star } from 'lucide-react'
import SentimentBadge from './SentimentBadge.jsx'

function getRelativeTime(dateString) {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return new Date(dateString).toLocaleDateString()
}

export default function ReviewCard({ review, isNew = false }) {
  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface-card p-5 transition-all duration-300 hover:border-surface-elevated ${
        isNew ? 'animate-slide-in border-accent-purple/40' : ''
      }`}
    >
      {/* Top row: sentiment + time */}
      <div className="flex items-center justify-between">
        <SentimentBadge sentiment={review.sentiment} />
        <span className="text-xs text-gray-500">{getRelativeTime(review.created_at)}</span>
      </div>

      {/* Transcript */}
      <p className="mt-3 text-sm leading-relaxed text-gray-200">
        &ldquo;{review.transcript}&rdquo;
      </p>

      {/* Stars */}
      <div className="mt-3 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= review.star_rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-gray-500">{review.star_rating}/5</span>
      </div>

      {/* Keywords */}
      {review.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex rounded-lg bg-accent-indigo/10 px-2.5 py-1 text-xs font-medium text-accent-indigo"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
