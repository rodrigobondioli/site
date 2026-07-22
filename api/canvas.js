// GET  /api/canvas?course=p1  -> carrega respostas do aluno
// POST /api/canvas { course, block, data } -> salva um bloco
import { getUser } from './_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };

  if (req.method === 'GET') {
    const course = (req.query?.course) || 'p1-generico-especialista';
    const r = await fetch(`${url}/rest/v1/canvas_answers?user_id=eq.${user.id}&course_id=eq.${course}&select=block,data,updated_at`, { headers: H });
    return res.status(r.ok ? 200 : 502).json(await r.json());
  }

  if (req.method === 'POST') {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { course = 'p1-generico-especialista', block, data } = body || {};
    if (block == null) return res.status(400).json({ error: 'block é obrigatório.' });
    const row = { user_id: user.id, course_id: course, block, data: data ?? {}, updated_at: new Date().toISOString() };
    const r = await fetch(`${url}/rest/v1/canvas_answers?on_conflict=user_id,course_id,block`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    return res.status(r.ok ? 200 : 502).json(await r.json());
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
