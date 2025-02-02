import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('cron_results').select('count(*)', { count: 'exact' })
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message)
    } else {
      console.log('Successfully connected to Supabase!')
      console.log('Number of rows in cron_results table:', data[0].count)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testConnection()