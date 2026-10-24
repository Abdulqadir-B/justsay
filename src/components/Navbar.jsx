import { LogOut, LayoutDashboard, MessageSquare, QrCode } from 'lucide-react'
import BrandLogo from './BrandLogo.jsx'

export default function Navbar({
  business,
  userEmail,
  activeTab,
  onTabChange,
  reviewCount = 0,
  onLogout,
}) {

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Left: Brand + Context Badge */}
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" className="hidden xs:flex" />

          {business && (
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
              <span className="text-xs font-medium text-zinc-300 max-w-[140px] sm:max-w-[200px] truncate">
                {business.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        {business && (
          <nav className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('overview')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reviews')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reviews</span>
              {reviewCount > 0 && (
                <span className="ml-1 rounded-full bg-zinc-700/60 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                  {reviewCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('share')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                activeTab === 'share'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Share & Link</span>
            </button>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {userEmail && (
            <span className="hidden md:inline text-xs text-zinc-500 max-w-[150px] truncate" title={userEmail}>
              {userEmail}
            </span>
          )}
          <button
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  )
}
