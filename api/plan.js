// GET  /api/plan?course=p1  -> último posicionamento gerado pelo Estrategista (ou null)
// POST /api/plan { course, data } -> salva um novo posicionamento
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
    const r = await fetch(`${url}/rest/v1/plans?user_id=eq.${user.id}&course_id=eq.${course}&select=data,created_at&order=created_at.desc&limit=1`, { headers: H });
    if (!r.ok) return res.status(502).json({ error: 'falha ao carregar' });
    const rows = await r.json();
    return res.status(200).json({ plan: (rows && rows[0]) ? rows[0].data : null });
  }

  if (req.method === 'POST') {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { course = 'p1-generico-especialista', data } = body || {};
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data é obrigatório.' });
    const row = { user_id: user.id, course_id: course, data, created_at: new Date().toISOString() };
    const r = await fetch(`${url}/rest/v1/plans`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : await r.json());
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
