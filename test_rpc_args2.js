import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const params = [
    undefined,
    { target_date: '2026-04-19' },
    { as_of_date: '2026-04-19' },
    { date: '2026-04-19' },
    { p_date: '2026-04-19' }
  ];

  for (const p of params) {
    const { data: d, error: e } = await supabase.rpc('get_todays_energy', p);
    if (e) {
      console.log('param:', p ? Object.keys(p)[0] : 'none', '-> Error:', e.message);
    } else {
      console.log('param:', p ? Object.keys(p)[0] : 'none', '-> Success:', d);
    }
  }
}

main();
