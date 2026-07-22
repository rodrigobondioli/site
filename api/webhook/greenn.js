// Greenn -> pagou -> grava course_access no Supabase.
// Config: GREENN_WEBHOOK_SECRET, e o mapa GREENN_PRODUCT_MAP (JSON: {"<id_produto_greenn>":"<course_id>"}).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // valida segredo (Greenn manda um token/segredo — ajustar ao formato real do painel)
  const secret = process.env.GREENN_WEBHOOK_SECRET;
  const got = req.headers['x-greenn-signature'] || req.query?.secret;
  if (secret && got !== secret) return res.status(401).json({ error: 'assinatura inválida' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  // ⚠️ AJUSTAR aos nomes reais do payload do Greenn (email do comprador, id do produto, status)
  const email = body?.client?.email || body?.email;
  const status = body?.status || body?.sale_status;
  const productId = String(body?.product?.id || body?.product_id || '');
  const paid = ['paid', 'approved', 'aprovado', 'completed'].includes(String(status).toLowerCase());
  if (!paid || !email) return res.status(200).json({ ignored: true });

  let map = {}; try { map = JSON.parse(process.env.GREENN_PRODUCT_MAP || '{}'); } catch {}
  const courseId = map[productId] || 'p1-generico-especialista';

  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };

  // acha/cria o usuário por email (via admin), depois concede acesso
  const u = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers: H });
  let userId = null;
  if (u.ok) { const j = await u.json(); userId = j?.users?.[0]?.id || null; }
  if (!userId) {
    const c = await fetch(`${url}/auth/v1/admin/users`, { method: 'POST', headers: H,
      body: JSON.stringify({ email, email_confirm: true }) });
    if (c.ok) { const j = await c.json(); userId = j?.id || j?.user?.id || null; }
  }
  if (!userId) return res.status(502).json({ error: 'não consegui resolver o usuário' });

  const r = await fetch(`${url}/rest/v1/course_access?on_conflict=user_id,course_id`, {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: userId, course_id: courseId, granted_at: new Date().toISOString() }),
  });
  return res.status(r.ok ? 200 : 502).json({ ok: r.ok, course: courseId, email });
}
