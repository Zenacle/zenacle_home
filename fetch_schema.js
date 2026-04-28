import fs from 'fs';

const SUPABASE_URL = 'https://llmyvutkvrxnhzkptbar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbXl2dXRrdnJ4bmh6a3B0YmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDAwNjAsImV4cCI6MjA4OTc3NjA2MH0.F2GfOp4k_giCXoc0pMNAI4myoRNyIWooI7sdxSqEqDs';

async function fetchSchema() {
  const url = `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
  console.log('Schema saved to schema.json');
}

fetchSchema();
