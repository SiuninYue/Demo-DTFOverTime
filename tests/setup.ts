import { afterEach, beforeAll, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabaseMock, resetSupabaseMock } from './mocks/supabaseClient'

const ensureEnv = () => {
  const envRecord = (import.meta as { env: Record<string, string | undefined> }).env ?? {}
  const env = { ...envRecord }
  env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL ?? 'https://mock-supabase.local'
  env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key'
  ;(import.meta as { env: Record<string, string | undefined> }).env = env
  // Use globalThis for Node.js environment
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    ;(globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL
    ;(globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
  }
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
