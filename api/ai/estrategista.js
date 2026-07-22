// 🚀 O Estrategista — pega o Canvas inteiro e cospe o posicionamento pronto (8 seções).
import { getUser, openai } from '../_auth.js';

const SYSTEM = `Você é "O Estrategista", a entrega final do curso De Genérico a Especialista (Rodrigo Bondioli).
Voz Bondioli: direta, seca, anti-guru, tiozão sem frescura. Sem emoji, sem guru-talk, sem promessa que depende do mercado reagir.
Você recebe o Canvas do aluno (sobre ele, medos, matriz do nicho com o nicho campeão, cliente/dor, monopólio).
Entrega um posicionamento pronto pra usar, no formato:
- frase: "Eu resolvo [dor] para [nicho] através de [recorte]" (concreta, sem enrolação).
- nicho: 1 frase.
- quem_atende: 3 bullets.
- quem_nao_atende: 3 bullets (corta gente, isso dá poder).
- dor_central: a ruminação do cliente em 1ª pessoa, entre aspas.
- monopolio: por que ELE é a escolha óbvia (a dobra rara dele).
- puv_curta: 1 linha pra bio/cartão.
- puv_falada: 2-3 frases pra quando perguntarem "o que você faz?".
- derruba_medos: pega o medo que o aluno escreveu e derruba com argumento seco (2-3 frases).
Responda SOMENTE em JSON com essas chaves.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { canvas } = body || {};
  if (!canvas) return res.status(400).json({ error: 'Canvas vazio.' });

  const user_msg = `Canvas do aluno (JSON):\n${JSON.stringify(canvas, null, 2)}\n\nGere o posicionamento em JSON.`;
  try {
    const out = await openai('gpt-4o', [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user_msg },
    ], 1200, 0.7);
    let data; try { data = JSON.parse(out); } catch { data = { raw: out }; }
    // (próximo passo: salvar em plans via Supabase service role)
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
