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
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateString).toLocaleDateString()
}

export default function ReviewCard({ review, isNew = false, onKeywordClick }) {
  const scorePercent = Math.round((review.sentiment_score ?? 0) * 100)

  return (
    <div
      className={`rounded-xl border border-zinc-800/90 bg-[#121215] p-5 transition-colors hover:border-zinc-700/80 ${
        isNew ? 'animate-slide-in border-zinc-500' : ''
      }`}
    >
      {/* Top row: sentiment + sentiment score + stars + timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SentimentBadge sentiment={review.sentiment} />
          <span className="text-[11px] font-mono text-zinc-500">
            {scorePercent}% match
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= review.star_rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-none text-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-zinc-500">{getRelativeTime(review.created_at)}</span>
      </div>

      {/* Transcript */}
      <p className="mt-3 text-sm leading-relaxed text-zinc-200 font-normal">
        &ldquo;{review.transcript}&rdquo;
      </p>

      {/* Keywords */}
      {review.keywords && review.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-zinc-800/60">
          <span className="text-[11px] text-zinc-500 mr-1">Tags:</span>
          {review.keywords.map((keyword, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onKeywordClick?.(keyword)}
              className="inline-flex rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              #{keyword}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
