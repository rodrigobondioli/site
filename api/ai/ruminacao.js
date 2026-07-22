// 🧠 Caça à Ruminação — acha a dor-loop do cliente do aluno (1ª pessoa) e separa dor vs vitamina.
import { getUser, ai, extractJSON, MODEL_FAST } from '../_auth.js';

const SYSTEM = `Você é a "Caça à Ruminação", parte do curso De Genérico a Especialista do Rodrigo Bondioli.
Voz: direta, seca, anti-guru, sem floreio. Nada de emoji, nada de "querido(a)".
Tarefa: a partir do nicho e do que o aluno descreveu do cliente dele, você acha a DOR-LOOP —
aquela frase que gira na cabeça do cliente toda semana, em 1ª PESSOA (como o cliente pensaria).
Regras:
- Dor-loop ≠ vitamina. Vitamina é "seria bom ter". Dor-loop tira o sono e faz ele procurar solução AGORA.
- 4 a 6 ruminações curtas, em 1ª pessoa, específicas do nicho (nada genérico como "quero crescer").
- Depois, aponte A DOR CENTRAL: a que mais dói e move dinheiro.
Responda em JSON: {"ruminacoes":["...","..."],"dor_central":"...","porque":"1 frase seca explicando por que essa é a central"}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { nicho, cliente } = body || {};
  if (!nicho) return res.status(400).json({ error: 'Informe o nicho.' });

  const user_msg = `Nicho: ${nicho}\nO que o aluno sabe do cliente: ${cliente || '(pouca coisa — deduza pelo nicho)'}\nDevolva o JSON.`;
  try {
    const out = await ai(MODEL_FAST(), [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user_msg },
    ], 2048, 0.8);
    const data = extractJSON(out) || { raw: out };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
