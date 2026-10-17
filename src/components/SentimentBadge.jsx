const sentimentConfig = {
  positive: {
    label: 'Positive',
    bgClass: 'bg-sentiment-positive/15',
    textClass: 'text-sentiment-positive',
  },
  neutral: {
    label: 'Neutral',
    bgClass: 'bg-sentiment-neutral/15',
    textClass: 'text-sentiment-neutral',
  },
  negative: {
    label: 'Negative',
    bgClass: 'bg-sentiment-negative/15',
    textClass: 'text-sentiment-negative',
  },
}

export default function SentimentBadge({ sentiment, className = '' }) {
  const config = sentimentConfig[sentiment] ?? sentimentConfig.neutral

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          sentiment === 'positive'
            ? 'bg-sentiment-positive'
            : sentiment === 'negative'
              ? 'bg-sentiment-negative'
              : 'bg-sentiment-neutral'
        }`}
      />
      {config.label}
    </span>
  )
}
