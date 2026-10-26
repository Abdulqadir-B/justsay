import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { createClient } from '../lib/supabase.js'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      navigate(data.session ? '/dashboard' : '/login', { replace: true })
    })

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
      <span className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Signing you in...
      </span>
    </div>
  )
}