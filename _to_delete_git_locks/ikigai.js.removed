// 🎯 Ikigai do Nicho — cruza amor × dom × mercado × acesso e devolve CANDIDATOS DE NICHO pro designer.
import { getUser, ai, extractJSON, MODEL_SMART } from '../_auth.js';

const SYSTEM = `Você é o "Ikigai do Nicho", ferramenta do curso De Genérico a Especialista do Rodrigo Bondioli (movimento Anti Designer Pato).
Voz: direta, seca, anti-guru, tiozão sem frescura. Zero emoji, zero "querido(a)", zero marketingês ("potencial", "alta performance", "resultado extraordinário", "jornada", "propósito de vida").

CONTEXTO: quem responde é um designer que faz de tudo e ganha mal, e quer escolher UM nicho pra parar de competir com todo mundo. NÃO é ikigai de "sentido da vida" — é ikigai aplicado a ESCOLHER NICHO DE ATUAÇÃO.

Você recebe as respostas do designer em 4 frentes:
- AMOR: tipos de projeto e mundos/assuntos que ele curte.
- DOM: o que ele faz melhor que a média, com prova/resultado real.
- MERCADO: que empresas pagam bem e que dor cara o design resolve pra elas.
- ACESSO: onde ele tem porta de entrada (rede, ex-clientes, comunidades) + o chute inicial de nicho dele.

TAREFA: cruzar as 4 frentes e devolver 2 a 3 CANDIDATOS DE NICHO concretos.
Regras dos candidatos:
- NICHO = VERTICAL (o mercado/tipo de cliente: "clínicas de estética", "hamburguerias artesanais") + HORIZONTAL (a situação/serviço: "que querem lotar a agenda", "que vão abrir a segunda unidade"). Nunca só "design pra restaurante".
- Cada candidato tem que se sustentar nas 4 frentes: ele curte, ele é bom, o mercado paga, ele tem acesso. Se faltar uma, diga qual falta.
- Prioriza onde o designer JÁ tem prova e JÁ tem acesso — é o que ele valida mais rápido.
- Proibido genérico ("pequenas empresas", "empreendedores"). Tem que doer de tão específico.
- Ancora no que resolve DINHEIRO pro cliente do nicho, não em estética.

Responda SÓ em JSON, sem texto fora:
{
 "candidatos": [
   {"nicho":"vertical + horizontal, numa frase","forca":"alta|media","porque":"1-2 frases secas: por que converge nas 4 frentes DELE (cita a prova/acesso que ele deu)","risco":"1 frase: o furo ou o que falta"}
 ],
 "convergencia":"1-2 frases: onde as 4 frentes se cruzam de verdade nesse designer",
 "faltando":"1-2 frases: contradição, buraco ou o que ele precisa reunir antes de cravar",
 "plano":["passo concreto 1 (validação, não teoria)","passo 2","passo 3"]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const r = (body && body.respostas) || {};
  const val = (k) => (r[k] && String(r[k]).trim()) || '(vazio)';

  const has = Object.values(r).filter(v => v && String(v).trim()).length;
  if (has < 3) return res.status(400).json({ error: 'Responde mais algumas antes de gerar.' });

  const user_msg = `Respostas do designer:

AMOR
- Projetos que acendem: ${val('amor_projetos')}
- Mundos/assuntos que curte: ${val('amor_mundos')}

DOM
- Entrega melhor que a média: ${val('dom_forte')}
- Resultado concreto já gerado: ${val('dom_prova')}

MERCADO
- Quem já pagou / paga bem: ${val('mercado_quem')}
- Dor cara que o design resolve: ${val('mercado_dor')}

ACESSO
- Porta de entrada / rede: ${val('acesso_porta')}
- Chute inicial de nicho: ${val('acesso_chute')}

Cruza tudo e devolve o JSON com os candidatos de nicho.`;

  try {
    const out = await ai(MODEL_SMART(), [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user_msg },
    ], 2600, 0.8);
    const data = extractJSON(out) || { raw: out };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
