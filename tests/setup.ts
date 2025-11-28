import { afterEach, beforeAll, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabaseMock, resetSupabaseMock } from './mocks/supabaseClient'

const ensureEnv = () => {
  const env = (import.meta as any).env ?? {}
  env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL ?? 'https://mock-supabase.local'
  env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key'
  ;(import.meta as any).env = env
  process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL
  process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
}

beforeAll(() => {
  ensureEnv()
})

vi.mock('@/config/supabase', () => {
  const client = getSupabaseMock()
  return {
    getSupabaseClient: () => client as unknown as SupabaseClient<Database>,
  }
})

afterEach(() => {
  resetSupabaseMock()
})
