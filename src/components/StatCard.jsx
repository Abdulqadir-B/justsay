export default function StatCard({ title, value, subtitle, icon, accentColor = 'text-accent-purple' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-6 transition-all duration-300 hover:border-accent-purple/30 hover:shadow-lg hover:shadow-accent-purple/5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated text-gray-500 transition-colors group-hover:text-accent-purple">
            {icon}
          </div>
        </div>

        <div className="mt-3">
          <p className={`text-3xl font-bold tracking-tight ${accentColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
