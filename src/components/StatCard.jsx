export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  progress, // Optional progress percentage (0 - 100)
  progressColor = 'bg-zinc-100',
}) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#121215] p-5 transition-colors hover:border-zinc-700/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-400">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          {badge && (
            <span className="text-[11px] font-medium text-zinc-400">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        {typeof progress === 'number' && (
          <div className="w-full h-1 bg-zinc-800/90 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${progressColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
