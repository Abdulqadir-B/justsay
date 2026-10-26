import { Link } from 'react-router-dom'
import { ArrowLeft, AudioLines } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-zinc-100">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-emerald-400">
          <AudioLines className="h-6 w-6" />
        </div>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">This page does not exist.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-400">
          The link may be incorrect or the page may have moved. Return to JustSay and keep collecting useful feedback.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex items-center gap-2 px-5 py-3">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </main>
  )
}
