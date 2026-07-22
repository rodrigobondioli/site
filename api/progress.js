// GET  /api/progress?course=...                 -> lista lesson_id concluídas do aluno
// POST /api/progress { course, lesson_id, done } -> marca/desmarca aula concluída
import { getUser } from './_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };
  const course = (req.query?.course) || 'p1-generico-especialista';

  if (req.method === 'GET') {
    const r = await fetch(`${url}/rest/v1/progress?user_id=eq.${user.id}&course_id=eq.${encodeURIComponent(course)}&status=eq.done&select=lesson_id`, { headers: H });
    if (!r.ok) return res.status(502).json({ error: await r.text() });
    const rows = await r.json();
    return res.status(200).json({ done: rows.map(x => x.lesson_id) });
  }

  if (req.method === 'POST') {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { lesson_id, done = true, course: c = course } = body || {};
    if (!lesson_id) return res.status(400).json({ error: 'lesson_id obrigatório.' });
    if (done) {
      const r = await fetch(`${url}/rest/v1/progress?on_conflict=user_id,course_id,lesson_id`, {
        method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ user_id: user.id, course_id: c, lesson_id, status: 'done', updated_at: new Date().toISOString() }),
      });
      return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true, done: true } : { error: await r.text() });
    } else {
      const r = await fetch(`${url}/rest/v1/progress?user_id=eq.${user.id}&course_id=eq.${encodeURIComponent(c)}&lesson_id=eq.${encodeURIComponent(lesson_id)}`, { method: 'DELETE', headers: H });
      return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true, done: false } : { error: await r.text() });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
