async function run() {
  const url = 'https://ggsnardgkluqvpaimzup.supabase.co/functions/v1/openrouter-ai';
  const headers = { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc25hcmRna2x1cXZwYWltenVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzg1NDQsImV4cCI6MjA4ODYxNDU0NH0.Sh85NHbPVkcRSxSIa9CWOpv00Jn9xzR_9ZcGYPWjhxo',
    'Content-Type': 'application/json' 
  };
  const body = JSON.stringify({ prompt: 'Hello', systemPrompt: 'Test' });
  const res = await fetch(url, { method: 'POST', headers, body });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run().catch(console.error);
