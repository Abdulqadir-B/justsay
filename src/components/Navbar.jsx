import { LogOut, LayoutDashboard, MessageSquare, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
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
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        
        {/* Left: Brand + Context Badge */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link to="/" aria-label="Go to home" className="shrink-0">
            <BrandLogo size="sm" className="hidden sm:flex" />
            <span className="text-xs font-medium text-zinc-300 sm:hidden">Home</span>
          </Link>

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
          <nav className="order-3 grid w-full grid-cols-3 items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-1 text-xs md:order-none md:absolute md:left-1/2 md:top-1/2 md:flex md:w-auto md:-translate-x-1/2 md:-translate-y-1/2">
            <button
              type="button"
              onClick={() => onTabChange('overview')}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 font-medium transition-all sm:gap-1.5 sm:px-3 ${
                activeTab === 'overview'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="truncate">Overview</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('reviews')}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 font-medium transition-all sm:gap-1.5 sm:px-3 ${
                activeTab === 'reviews'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="truncate">Reviews</span>
              {reviewCount > 0 && (
                <span className="ml-1 rounded-full bg-zinc-700/60 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                  {reviewCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('share')}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 font-medium transition-all sm:gap-1.5 sm:px-3 ${
                activeTab === 'share'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span className="truncate">Share & Link</span>
            </button>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {userEmail && (
            <span className="hidden md:inline text-xs text-zinc-500 max-w-[150px] truncate" title={userEmail}>
              {userEmail}
            </span>
          )}
          <button
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:gap-1.5 sm:px-2.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  )
}
