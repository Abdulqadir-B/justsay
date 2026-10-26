import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '../lib/supabase.js'
import { Loader2, CheckCircle2, Eye, EyeOff, Chrome } from 'lucide-react'
import BrandLogo from '../components/BrandLogo.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate('/dashboard', { replace: true })
    })

    return () => {
      active = false
    }
  }, [navigate])

  function switchMode(next) {
    setMode(next)
    setError(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setSignUpSuccess(false)
  }

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        },
      })

      if (authError) setError(authError.message)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Google authentication error:', err)
      }
      setError(err?.message || 'Unable to continue with Google. Please try again.')
    } finally {
      setLoading(false)
    }
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
      const cleanEmail = email.trim().toLowerCase()

      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (authError) { setError(authError.message); return }
        navigate('/dashboard')
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: cleanEmail, password })
        if (authError) { setError(authError.message); return }

        // If email confirmation is disabled or auto-confirmed, session is immediately active
        if (data?.session) {
          navigate('/dashboard')
          return
        }

        // Supabase returns an empty identities list if user already exists
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please switch to Sign In.')
          return
        }

        setSignUpSuccess(true)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Authentication error:', err)
      }
      setError(err?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <BrandLogo size="md" showName={false} />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">JustSay</h1>
            <p className="mt-1 text-xs text-zinc-400">
              {mode === 'signin' ? 'Sign in to access your business dashboard' : 'Create an account to start collecting voice reviews'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-6 shadow-xl">
          {/* Tab Toggle */}
          <div className="mb-5 flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-white py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Chrome className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-600">
            <div className="h-px flex-1 bg-zinc-800" />
            <span>or use email</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Success State */}
          {signUpSuccess ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-center animate-fade-in">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="font-medium text-sm text-white">Check your email</p>
                <p className="mt-1 text-xs text-zinc-400">
                  We sent a confirmation link to <span className="font-medium text-zinc-200">{email}</span>. Click it to verify, then sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="mt-2 text-xs font-medium text-zinc-300 underline hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  required
                  className="input-subtle"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-subtle pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-300 focus:outline-none focus:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input-subtle pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-300 focus:outline-none focus:text-zinc-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 mt-2"
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

        <Link
          to="/"
          className="mt-5 block text-center text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
