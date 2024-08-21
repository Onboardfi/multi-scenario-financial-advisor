import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// Create client-side (anon) client
export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Create server-side (service role) client
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

// Test the connection using the admin client, if available
if (supabaseAdmin) {
  supabaseAdmin.from('cron_results').select('count', { count: 'exact' }).then(
    ({ count, error }) => {
      if (error) {
        console.error('Error connecting to Supabase:', error)
      } else {
        console.log('Successfully connected to Supabase. Row count:', count)
      }
    }
  )
} else {
  console.warn('Supabase admin client not initialized. Check your environment variables.')
}