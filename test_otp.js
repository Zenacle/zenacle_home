import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const email = 'sadhir12@gmail.com';
  // Attempt with common dummy OTPs
  for (const otp of ['123456', '000000', '111111']) {
    console.log(`Trying ${otp}...`);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (!error && data.session) {
      console.log('Success with', otp, 'Session:', data.session.access_token);
      return;
    }
    console.log('Error:', error?.message);
  }
}
main();
