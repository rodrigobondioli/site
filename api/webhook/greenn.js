// Webhook do Greenn -> libera/revoga acesso no Supabase.
// Payload real do Greenn (evento saleUpdated):
//   { currentStatus, type:"sale", event, sale:{status,id}, client:{email,name}, product:{id,name} }
// Status: paid | refused | refunded | chargedback | waiting_payment
// Segurança: Greenn não assina o webhook (sem HMAC documentado) -> use um segredo na URL:
//   https://app.rodrigobondioli.com/api/webhook/greenn?secret=SEU_SEGREDO
// Config: GREENN_WEBHOOK_SECRET, GREENN_PRODUCT_MAP (JSON: {"<product_id>":"<course_id>"})

import { resolveUserByEmail } from '../_auth.js';

const PAID = ['paid'];
const REVOKE = ['refunded', 'chargedback'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // valida o segredo da URL (?secret=) ou header
  const secret = process.env.GREENN_WEBHOOK_SECRET;
  const got = req.query?.secret || req.headers['x-greenn-secret'];
  if (secret && got !== secret) return res.status(401).json({ error: 'segredo inválido' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const status = String(body.currentStatus || body.sale?.status || '').toLowerCase();
  const email = (body.client?.email || '').trim().toLowerCase();
  const productId = String(body.product?.id ?? '');
  if (!email) return res.status(200).json({ ignored: true, reason: 'sem email' });

  let map = {}; try { map = JSON.parse(process.env.GREENN_PRODUCT_MAP || '{}'); } catch {}
  const courseId = map[productId] || 'p1-generico-especialista';

  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const H = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };

  // acha o usuário por email (lookup confiável via função SQL); cria se não existir
  const resolveUser = () => resolveUserByEmail(email, true);

  if (PAID.includes(status)) {
    const userId = await resolveUser();
    if (!userId) return res.status(502).json({ error: 'não resolvi o usuário' });
    const r = await fetch(`${url}/rest/v1/course_access?on_conflict=user_id,course_id`, {
      method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: userId, course_id: courseId, granted_at: new Date().toISOString() }),
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, action: 'granted', course: courseId, email });
  }

  if (REVOKE.includes(status)) {
    const userId = await resolveUserByEmail(email, false);
    if (userId) {
      await fetch(`${url}/rest/v1/course_access?user_id=eq.${userId}&course_id=eq.${courseId}`,
        { method: 'DELETE', headers: H });
    }
    return res.status(200).json({ ok: true, action: 'revoked', course: courseId, email });
  }

  // refused / waiting_payment / outros -> ignora
  return res.status(200).json({ ignored: true, status });
}
