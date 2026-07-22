// Admin: alunos e acessos. Travado em ADMIN_EMAILS.
//   GET    /api/admin/students?course=...            -> lista quem tem acesso (email + granted_at)
//   POST   /api/admin/students { email, course }      -> libera acesso na mão (cria user se preciso)
//   DELETE /api/admin/students?email=..&course=..     -> revoga acesso
import { getUser, isAdmin } from '../_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  if (!isAdmin(user)) return res.status(403).json({ error: 'Só admin.' });

  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };

  async function resolveUser(email, create) {
    const u = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers: H });
    if (u.ok) { const j = await u.json(); const id = j?.users?.[0]?.id; if (id) return id; }
    if (!create) return null;
    const c = await fetch(`${url}/auth/v1/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ email, email_confirm: true }) });
    if (c.ok) { const j = await c.json(); return j?.id || j?.user?.id || null; }
    return null;
  }

  if (req.method === 'GET') {
    const course = (req.query?.course) || 'p1-generico-especialista';
    const r = await fetch(`${url}/rest/v1/course_access?course_id=eq.${encodeURIComponent(course)}&select=user_id,granted_at&order=granted_at.desc`, { headers: H });
    if (!r.ok) return res.status(502).json({ error: await r.text() });
    const rows = await r.json();
    let emails = {};
    if (rows.length) {
      const ids = rows.map(x => x.user_id).join(',');
      const p = await fetch(`${url}/rest/v1/profiles?id=in.(${ids})&select=id,email`, { headers: H });
      if (p.ok) for (const pr of await p.json()) emails[pr.id] = pr.email;
    }
    const students = rows.map(x => ({ user_id: x.user_id, email: emails[x.user_id] || '—', granted_at: x.granted_at }));
    return res.status(200).json({ students });
  }

  if (req.method === 'POST') {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const email = (body?.email || '').trim().toLowerCase();
    const course = body?.course || 'p1-generico-especialista';
    if (!email || email.indexOf('@') < 0) return res.status(400).json({ error: 'E-mail inválido.' });
    const userId = await resolveUser(email, true);
    if (!userId) return res.status(502).json({ error: 'Não consegui criar/achar o usuário.' });
    const r = await fetch(`${url}/rest/v1/course_access?on_conflict=user_id,course_id`, {
      method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: userId, course_id: course, granted_at: new Date().toISOString() }),
    });
    return res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true, email } : { error: await r.text() });
  }

  if (req.method === 'DELETE') {
    const email = (req.query?.email || '').trim().toLowerCase();
    const course = req.query?.course || 'p1-generico-especialista';
    if (!email) return res.status(400).json({ error: 'email obrigatório.' });
    const userId = await resolveUser(email, false);
    if (userId) {
      await fetch(`${url}/rest/v1/course_access?user_id=eq.${userId}&course_id=eq.${encodeURIComponent(course)}`, { method: 'DELETE', headers: H });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
