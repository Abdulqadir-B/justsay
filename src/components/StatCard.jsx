export default function StatCard({ title, value, subtitle, icon, accentColor = 'text-zinc-100' }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#121215] p-5 transition-colors hover:border-zinc-700/80">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <p className={`text-2xl font-semibold tracking-tight text-white`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
