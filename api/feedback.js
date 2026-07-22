// Recebe Suporte / Sugestão do app e envia por e-mail (Resend) pro Rodrigo.
// Requer RESEND_API_KEY (já existe no projeto). Opcional: getUser pra anexar o e-mail do aluno.
import { getUser } from './_auth.js';

function esc(s){ return String(s==null?'':s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { kind = 'suporte', tipo = '', assunto = '', mensagem = '' } = body || {};
  if (!mensagem || !String(mensagem).trim()) return res.status(400).json({ error: 'Escreve a mensagem.' });

  const user = await getUser(req);
  const email = user?.email || body?.email || 'aluno (não logado)';
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY não configurada.' });

  const isSug = kind === 'sugestao';
  const subject = isSug ? `💡 Sugestão — ${tipo || 'Geral'}` : `🆘 Suporte — ${assunto || 'Sem assunto'}`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Anti Designer Pato <acesso@send.rodrigobondioli.com>',
        to: ['hello@rodrigobondioli.com'],
        reply_to: user?.email || undefined,
        subject,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;line-height:1.6">
          <h2 style="margin:0 0 12px">${isSug ? 'Nova sugestão' : 'Pedido de suporte'}</h2>
          <p><b>De:</b> ${esc(email)}</p>
          ${isSug ? `<p><b>Tipo:</b> ${esc(tipo || '—')}</p>` : `<p><b>Assunto:</b> ${esc(assunto || '—')}</p>`}
          <p><b>Mensagem:</b><br>${esc(mensagem).replace(/\n/g,'<br>')}</p>
        </div>`,
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Falha no envio', detail: await r.text() });
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'Erro interno' }); }
}
