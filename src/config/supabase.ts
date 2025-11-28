import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseMock } from '@/services/supabase/mockClient'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const explicitUseMock = import.meta.env.VITE_SUPABASE_USE_MOCK === 'true'
const hasMockUrl = supabaseUrl?.includes('mock-supabase') ?? false
const missingCreds = !supabaseUrl || !supabaseAnonKey

if (!explicitUseMock && (hasMockUrl || missingCreds)) {
  throw new Error(
    [
      'Supabase configuration is incomplete.',
      'Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY to your real project or toggle VITE_SUPABASE_USE_MOCK=true for the built-in mock.',
    ].join(' '),
  )
}

const useMockSupabase = explicitUseMock || hasMockUrl || missingCreds

let cachedClient: SupabaseClient<Database> | null = null

const ensureEnv = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are missing. Update .env.local before making API calls.',
    )
  }
}

export const isUsingMockSupabase = () => useMockSupabase

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (useMockSupabase) {
    cachedClient = cachedClient ?? getSupabaseMock()
    return cachedClient
  }

  if (!cachedClient) {
    ensureEnv()
    cachedClient = createBrowserClient<Database>(supabaseUrl as string, supabaseAnonKey as string)
  }
  return cachedClient
}
