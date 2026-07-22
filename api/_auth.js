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
// É admin? Compara o e-mail do usuário logado com a lista ADMIN_EMAILS (separada por vírgula).
export function isAdmin(user) {
  const list = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const email = (user?.email || '').toLowerCase();
  return !!email && list.includes(email);
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
// Chamada de IA agnóstica de provider (formato OpenAI chat/completions).
// Default = Google Gemini (tier grátis, endpoint compatível com OpenAI).
// Trocar de provider = mudar AI_BASE_URL + AI_API_KEY (+ modelos AI_MODEL_*).
//   OpenAI:  AI_BASE_URL=https://api.openai.com/v1                          · modelo gpt-4o-mini
//   Gemini:  AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai · modelo gemini-2.0-flash
async function ai(model, messages, max_tokens = 900, temperature = 0.7) {
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('AI_API_KEY não configurada');
  const base = process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens, temperature }),
  });
  if (!r.ok) throw new Error('IA: ' + (await r.text()));
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

// tira cercas ```json ... ``` que alguns modelos colocam, e extrai o objeto
function extractJSON(text) {
  if (!text) return null;
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// modelos por tarefa (env override)
const MODEL_FAST = () => process.env.AI_MODEL_FAST || 'gemini-2.0-flash';
const MODEL_SMART = () => process.env.AI_MODEL_SMART || 'gemini-2.0-flash';

// alias retrocompatível
const openai = ai;
export { ai, openai, extractJSON, MODEL_FAST, MODEL_SMART };
