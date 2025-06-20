
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock client if environment variables are missing (for development)
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.')
    
    // Return a mock client to prevent app crashes during development
    return {
      auth: {
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signInWithOAuth: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.reject(new Error('Supabase not configured')),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      },
      from: () => ({
        select: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }),
        insert: () => Promise.reject(new Error('Supabase not configured')),
        update: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) }),
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
