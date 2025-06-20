
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase, UserProfile, UserTier } from './supabase'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        await get().fetchProfile(data.user.id)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Create user profile with default tier
        await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            tier: 'free' as UserTier,
          })
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, profile: null })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      set({ profile: { ...profile, ...updates } })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      set({ profile: data })
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))

// Initialize auth state only if supabase is properly configured
try {
  supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, setLoading, fetchProfile } = useAuthStore.getState()
    
    setUser(session?.user || null)
    
    if (session?.user) {
      fetchProfile(session.user.id)
    } else {
      useAuthStore.setState({ profile: null })
    }
    
    setLoading(false)
  })
} catch (error) {
  console.error('Auth initialization error:', error)
  useAuthStore.setState({ loading: false })
}
