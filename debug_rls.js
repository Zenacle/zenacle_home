import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debug() {
  const email = 'sadhir12@gmail.com'
  const otp = '123456' // Or try 000000

  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
  
  if (authError) {
    console.error('Login error:', authError.message)
    // Try fallback OTP 000000
    const { data: authData2, error: authError2 } = await supabase.auth.verifyOtp({ email, token: '000000', type: 'email' })
    if (authError2) {
        console.error('Login error (000000):', authError2.message)
        return
    }
  }

  console.log('Logged in successfully!');

  const { data: reports, error: reportsError } = await supabase
    .from('daily_reports')
    .select('*')

  console.log('ALL REPORTS:', reports)
  console.log('ERROR:', reportsError)
}

debug()
