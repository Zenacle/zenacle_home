import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const tables = ['daily_reports', 'appliance_readings', 'appliances', 'households', 'billing_cycle_summary', 'devices', 'reports'];
  const results = [];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table} Status: ERROR - ${error.message}`);
      } else {
        console.log(`Table ${table} Status: OK. Rows found: ${data.length}`);
      }
    } catch (e) {
      console.log(`Table ${table} Status: EXCEPTION - ${e.message}`);
    }
  }
  console.log(results.join('\n'));
}
main();
