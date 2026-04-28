import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  const email = 'sadhir12@gmail.com'
  const otp = '123456'

  console.log('Logging in sadhir12@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
  
  if (authError) {
    console.log('Login failed:', authError.message)
    return
  }
  console.log('Login success!')

  console.log('Fetching ALL daily_reports...');
  const { data, error } = await supabase.from('daily_reports').select('household_id, report_date, total_kwh')
  
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Data found:', data.length, 'rows')
    if (data.length > 0) {
      console.log('First row householdId:', data[0].household_id)
      console.log('First few rows:', data.slice(0, 3))
    }
  }
}

main()
