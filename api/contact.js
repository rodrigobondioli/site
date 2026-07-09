// Função serverless (Vercel) — envia o form via Resend para hello@rodrigobondioli.com
// Requer a env var RESEND_API_KEY configurada no Vercel.

function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const { nome, email, empresa, mensagem, botcheck } = body;

  if (botcheck) return res.status(200).json({ success: true }); // honeypot
  if (!nome || !email) return res.status(400).json({ error: 'Preencha nome e email.' });

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY não configurada.' });
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Site rodrigobondioli.com <contato@send.rodrigobondioli.com>',
        to: ['hello@rodrigobondioli.com'],
        reply_to: email,
        subject: `Novo contato pelo site — ${nome}`,
        html: `
          <div style="font-family:Arial,sans-serif;font-size:15px;color:#111;line-height:1.6">
            <h2 style="margin:0 0 16px">Novo contato pelo site</h2>
            <p><strong>Nome:</strong> ${esc(nome)}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>Empresa:</strong> ${esc(empresa || '—')}</p>
            <p><strong>Mensagem:</strong><br>${esc(mensagem || '—').replace(/\n/g, '<br>')}</p>
          </div>`,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return res.status(502).json({ error: 'Falha no envio', detail });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno' });
  }
}
