
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
  loading: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      console.log('Attempting to sign in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful:', data)
      if (data.user) {
        set({ user: data.user })
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
      console.log('Attempting to sign up with email:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
      
      console.log('Sign up successful:', data)
      if (data.user) {
        set({ user: data.user })
        // Create user profile with default tier
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              tier: 'free' as UserTier,
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
          } else {
            console.log('Profile created successfully')
            await get().fetchProfile(data.user.id)
          }
        } catch (profileError) {
          console.error('Error creating profile:', profileError)
        }
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
      console.log('Attempting Google sign in')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      
      if (error) {
        console.error('Google sign in error:', error)
        throw error
      }
      console.log('Google sign in initiated')
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
      console.log('Signing out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      console.log('Sign out successful')
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
      console.log('Updating profile:', updates)
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        console.error('Update profile error:', error)
        throw error
      }
      
      console.log('Profile updated successfully')
      set({ profile: { ...profile, ...updates } })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Fetch profile error:', error)
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile')
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                email: userData.user.email,
                tier: 'free' as UserTier,
              })
            
            if (!insertError) {
              // Fetch the newly created profile
              const { data: newProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()
              
              if (newProfile) {
                set({ profile: newProfile })
                console.log('Default profile created and fetched')
              }
            }
          }
        }
        return
      }
      
      console.log('Profile fetched successfully:', data)
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
const initializeAuth = async () => {
  try {
    console.log('Initializing auth state change listener')
    
    // Check initial session
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting initial session:', error)
      useAuthStore.setState({ loading: false })
      return
    }

    if (session?.user) {
      console.log('Initial session found, setting user')
      useAuthStore.setState({ user: session.user })
      await useAuthStore.getState().fetchProfile(session.user.id)
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      const { setUser, setLoading, fetchProfile } = useAuthStore.getState()
      
      setUser(session?.user || null)
      
      if (session?.user) {
        console.log('User logged in, fetching profile')
        await fetchProfile(session.user.id)
      } else {
        console.log('User logged out, clearing profile')
        useAuthStore.setState({ profile: null })
      }
      
      setLoading(false)
    })
  } catch (error) {
    console.error('Auth initialization error:', error)
    useAuthStore.setState({ loading: false })
  }
}

// Initialize auth
initializeAuth()
