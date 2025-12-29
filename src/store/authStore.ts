import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabaseClient } from '@/config/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>
  resetPassword: (newPassword: string) => Promise<{ error: Error | null }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        const supabase = getSupabaseClient()

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        set({
          session,
          user: session?.user ?? null,
          isInitialized: true
        })

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            user: session?.user ?? null
          })
        })
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()
        const sanitizedEmail = email.trim().toLowerCase()

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password,
          })

          if (error) {
            return { error }
          }

          set({
            user: data.user,
            session: data.session,
          })

          return { error: null }
        } catch (error) {
          return { error: error as Error }
        } finally {
          set({ isLoading: false })
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()
        const sanitizedEmail = email.trim().toLowerCase()
        const redirectTo =
          (import.meta.env.VITE_SUPABASE_REDIRECT_URL as string | undefined) ??
          (typeof window !== 'undefined' ? window.location.origin : undefined)

        try {
          const { data, error } = await supabase.auth.signUp({
            email: sanitizedEmail,
            password,
            options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
          })

          if (error) {
            return { error }
          }

          set({
            user: data.user,
            session: data.session,
          })

          return { error: null }
        } catch (error) {
          return { error: error as Error }
        } finally {
          set({ isLoading: false })
        }
      },

      signOut: async () => {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()
        set({
          user: null,
          session: null,
        })
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()
        const sanitizedEmail = email.trim().toLowerCase()

        try {
          const redirectTo = `${window.location.origin}/reset-password`

          const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
            redirectTo,
          })

          if (error) {
            return { error }
          }

          return { error: null }
        } catch (error) {
          return { error: error as Error }
        } finally {
          set({ isLoading: false })
        }
      },

      resetPassword: async (newPassword: string) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()

        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          })

          if (error) {
            return { error }
          }

          // After password reset, sign out to force re-login with new password
          await supabase.auth.signOut()
          set({
            user: null,
            session: null,
          })

          return { error: null }
        } catch (error) {
          return { error: error as Error }
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)
