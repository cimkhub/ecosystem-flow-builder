
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock client if environment variables are missing (for development)
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Using mock client for development.')
    
    // Return a mock client that simulates success responses to prevent loading state issues
    return {
      auth: {
        signInWithPassword: async () => {
          console.log('Mock sign in - would normally require Supabase configuration')
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Please configure Supabase to enable authentication' }
          }
        },
        signUp: async () => {
          console.log('Mock sign up - would normally require Supabase configuration')
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Please configure Supabase to enable authentication' }
          }
        },
        signInWithOAuth: async () => {
          console.log('Mock OAuth - would normally require Supabase configuration')
          return { 
            data: { url: null, provider: null }, 
            error: { message: 'Please configure Supabase to enable authentication' }
          }
        },
        signOut: async () => {
          console.log('Mock sign out')
          return { error: null }
        },
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (callback: any) => {
          console.log('Mock auth state change listener')
          return { data: { subscription: { unsubscribe: () => {} } }, error: null }
        },
      },
      from: () => ({
        select: () => ({ 
          single: async () => ({ 
            data: null, 
            error: { message: 'Please configure Supabase to enable database operations' }
          })
        }),
        insert: async () => ({ 
          data: null, 
          error: { message: 'Please configure Supabase to enable database operations' }
        }),
        update: () => ({ 
          eq: async () => ({ 
            data: null, 
            error: { message: 'Please configure Supabase to enable database operations' }
          })
        }),
      }),
    }
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient() as any

export type UserTier = 'free' | 'paid' | 'admin'

export interface UserProfile {
  id: string
  email: string
  tier: UserTier
  created_at: string
  updated_at: string
}
