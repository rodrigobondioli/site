// GET /api/lessons?course=p1-generico-especialista
// Retorna as aulas PUBLICADAS do curso pro aluno logado (com acesso) ou pro admin.
import { getUser, hasAccess, isAdmin } from './_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  const course = (req.query?.course) || 'p1-generico-especialista';
  const admin = isAdmin(user);
  if (!admin) {
    const ok = await hasAccess(user.id, course);
    if (!ok) return res.status(403).json({ error: 'Sem acesso a este curso.' });
  }

  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}` };

  // admin vê tudo (inclusive rascunho); aluno só publicado
  const pub = admin ? '' : '&is_published=eq.true';
  const sel = 'id,position,title,slug,video_provider,video_id,video_library,duration,tagline,description,exercise,canvas_block,materials,is_published';
  const r = await fetch(
    `${url}/rest/v1/lessons?course_id=eq.${encodeURIComponent(course)}${pub}&select=${sel}&order=position.asc`,
    { headers: H }
  );
  if (!r.ok) return res.status(502).json({ error: 'Falha ao carregar aulas', detail: await r.text() });
  const rows = await r.json();
  return res.status(200).json({ lessons: rows, library: process.env.BUNNY_LIBRARY || null });
}
