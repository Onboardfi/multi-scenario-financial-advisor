import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRoleKey)) {
  throw new Error('Missing Supabase environment variables')
}

// Create two clients: one for client-side (anon) and one for server-side (service role)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || '')
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || '')

// Test the connection using the admin client
supabaseAdmin.from('cron_results').select('count', { count: 'exact' }).then(
  ({ count, error }) => {
    if (error) {
      console.error('Error connecting to Supabase:', error)
    } else {
      console.log('Successfully connected to Supabase. Row count:', count)
    }
  }
)