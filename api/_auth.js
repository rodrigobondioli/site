// Verifica o token do usuário (Supabase) a partir do header Authorization: Bearer <access_token>.
export async function getUser(req) {
  const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!url || !anon || !token) return null;
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    return await r.json(); // { id, email, ... }
  } catch { return null; }
}
export async function hasAccess(userId, courseId) {
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !svc) return false;
  const r = await fetch(`${url}/rest/v1/course_access?user_id=eq.${userId}&course_id=eq.${courseId}&select=course_id`,
    { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}
async function openai(model, messages, max_tokens = 900, temperature = 0.7) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY não configurada');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens, temperature }),
  });
  if (!r.ok) throw new Error('OpenAI: ' + (await r.text()));
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}
export { openai };
