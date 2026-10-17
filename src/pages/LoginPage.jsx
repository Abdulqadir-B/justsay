import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '../lib/supabase.js'
import { Loader2, AudioLines, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setSignUpSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) { setError(authError.message); return }
        navigate('/dashboard')
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) { setError(authError.message); return }
        setSignUpSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-purple/10 border border-accent-purple/20">
            <AudioLines className="h-7 w-7 text-accent-purple" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">JustSay</h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'signin' ? 'Sign in to your dashboard' : 'Create your account'}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-xl border border-surface-border bg-surface-card p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'signin'
                ? 'bg-accent-purple text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-accent-purple text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Success State */}
        {signUpSuccess ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-6 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <div>
              <p className="font-semibold text-white">Check your email!</p>
              <p className="mt-1 text-sm text-gray-400">
                We sent a confirmation link to <span className="text-white">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-2 text-sm font-medium text-accent-purple hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent-purple px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-indigo focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
