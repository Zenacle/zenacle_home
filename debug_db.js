import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const email = 'sadhir12@gmail.com';
  let token = null;

  for (const otp of ['123456', '000000', '111111']) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (!error && data.session) {
      token = data.session;
      break;
    }
  }

  if (!token) {
    console.log('Login failed');
    return;
  }

  // Fetch household
  const { data: hData } = await supabase.from('households').select('*').limit(1);
  if (!hData || hData.length === 0) {
      console.log('No households');
      return;
  }
  const hid = hData[0].id;
  console.log('Household ID:', hid);

  // Fetch raw appliance readings
  const { data: rData, error: rError } = await supabase
      .from('appliance_readings')
      .select('*')
      .eq('household_id', hid)
      .limit(5);

  console.log('Readings Error:', rError);
  console.log('Raw Readings:', JSON.stringify(rData, null, 2));
}

main();
