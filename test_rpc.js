import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.rpc('get_todays_energy');
  console.log('today error:', error ? error.message : null);
  console.log('today data:', JSON.stringify(data, null, 2));

  const { data: chartData, error: chartError } = await supabase.rpc('get_weekly_chart_data');
  console.log('chart error:', chartError ? chartError.message : null);
  console.log('chart data:', JSON.stringify(chartData, null, 2));
}

main();
