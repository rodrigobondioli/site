// Admin CRUD de aulas. Travado em ADMIN_EMAILS.
//   GET    /api/admin/lessons?course=...        -> lista todas (inclusive rascunho)
//   POST   /api/admin/lessons  { ...lesson }     -> cria (sem id) ou atualiza (com id)
//   DELETE /api/admin/lessons?id=UUID            -> apaga
//   POST   /api/admin/lessons { action:'reorder', ids:[...] } -> reordena (position = índice)
import { getUser, isAdmin } from '../_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });
const FIELDS = ['course_id','position','title','slug','video_provider','video_id','video_library','duration','tagline','description','exercise','canvas_block','materials','is_published'];

function clean(body) {
  const o = {};
  for (const k of FIELDS) if (body[k] !== undefined) o[k] = body[k];
  return o;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  if (!isAdmin(user)) return res.status(403).json({ error: 'Só admin.' });

  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };
  const base = `${url}/rest/v1/lessons`;

  if (req.method === 'GET') {
    const course = (req.query?.course) || 'p1-generico-especialista';
    const r = await fetch(`${base}?course_id=eq.${encodeURIComponent(course)}&select=*&order=position.asc`, { headers: H });
    return res.status(r.ok ? 200 : 502).json(r.ok ? { lessons: await r.json() } : { error: await r.text() });
  }

  if (req.method === 'POST') {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    // reordenar
    if (body.action === 'reorder' && Array.isArray(body.ids)) {
      for (let i = 0; i < body.ids.length; i++) {
        await fetch(`${base}?id=eq.${body.ids[i]}`, { method: 'PATCH', headers: H, body: JSON.stringify({ position: i }) });
      }
      return res.status(200).json({ ok: true });
    }

    const data = clean(body);
    if (!data.title || !String(data.title).trim()) return res.status(400).json({ error: 'Título é obrigatório.' });
    if (!data.course_id) data.course_id = 'p1-generico-especialista';

    if (body.id) {
      const r = await fetch(`${base}?id=eq.${body.id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(data) });
      return res.status(r.ok ? 200 : 502).json(r.ok ? { lesson: (await r.json())[0] } : { error: await r.text() });
    } else {
      // nova aula: position = fim da lista se não vier
      if (data.position === undefined) {
        const c = await fetch(`${base}?course_id=eq.${encodeURIComponent(data.course_id)}&select=position&order=position.desc&limit=1`, { headers: H });
        const last = c.ok ? (await c.json())[0] : null;
        data.position = last ? (last.position + 1) : 0;
      }
      const r = await fetch(base, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(data) });
      return res.status(r.ok ? 200 : 502).json(r.ok ? { lesson: (await r.json())[0] } : { error: await r.text() });
    }
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: 'id obrigatório.' });
    const r = await fetch(`${base}?id=eq.${id}`, { method: 'DELETE', headers: H });
    return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: await r.text() });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
