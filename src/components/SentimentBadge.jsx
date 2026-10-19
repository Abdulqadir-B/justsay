const sentimentConfig = {
  positive: {
    label: 'Positive',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    dotClass: 'bg-emerald-400',
  },
  neutral: {
    label: 'Neutral',
    bgClass: 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300',
    dotClass: 'bg-zinc-400',
  },
  negative: {
    label: 'Negative',
    bgClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    dotClass: 'bg-rose-400',
  },
}

export default function SentimentBadge({ sentiment, className = '' }) {
  const config = sentimentConfig[sentiment] ?? sentimentConfig.neutral

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.bgClass} ${className}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}
