import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      )
    }
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}
