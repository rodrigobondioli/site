// 🧠 Caça à Ruminação — gera HIPÓTESES de dor-loop do cliente do aluno (1ª pessoa) e um plano de validação.
// NÃO descobre a dor real: produz as ruminações mais plausíveis, que o aluno precisa confirmar no campo.
// Compatível por adição: mantém {ruminacoes, dor_central, porque} que a UI já lê; acrescenta status/como_validar/aviso.
import { getUser, ai, extractJSON, MODEL_FAST } from '../_auth.js';

const SYSTEM = `Você é a "Caça à Ruminação", parte do curso De Genérico a Especialista do Rodrigo Bondioli.
Voz: direta, seca, anti-guru, sem floreio. Nada de emoji, nada de "querido(a)".

## O QUE VOCÊ FAZ (e o que NÃO faz)
A partir do nicho e do que o aluno descreveu do cliente, você gera as DOR-LOOPS mais PLAUSÍVEIS — a frase que gira na cabeça do cliente toda semana, em 1ª PESSOA (como o cliente pensaria).
VOCÊ NÃO DESCOBRE A DOR REAL. Você produz HIPÓTESES. A prova é o aluno ouvir de um cliente de verdade. Deixa isso claro no campo "porque" e entrega um plano de validação em "como_validar".

## REGRAS
- Dor-loop ≠ vitamina. Vitamina é "seria bom ter". Dor-loop tira o sono e faz procurar solução AGORA.
- 4 a 6 ruminações curtas, em 1ª pessoa, específicas do nicho.
- CRITÉRIO MÁXIMO: se a ruminação serve pra qualquer negócio, tá errada. Tem que falar do dinheiro, do cliente e da rotina ESPECÍFICOS desse dono — impossível de reutilizar pra outro nicho.
- Proibido marketingês e clichê: "crescimento", "potencial", "alta performance", "resultado extraordinário", "estratégico". O dono não fala assim.
- Depois, aponte A DOR CENTRAL: a que mais dói e move dinheiro.

## NÃO FABRIQUE DOR (importante)
Se o nicho vier GENÉRICO ou vago ("empresas", "profissionais liberais", "pequenos negócios", "quem quer crescer"), você NÃO inventa ruminações pra encaixar. Nesse caso:
- devolve "ruminacoes" vazio ou com no máximo 1 exemplo,
- deixa "dor_central" vazio,
- e preenche "aviso" dizendo, seco: que o nicho está genérico demais pra achar uma dor específica, e que o aluno precisa recortar o nicho (mercado + situação concreta) antes de rodar a Caça de novo.
Melhor dizer "não dá pra achar a dor com esse nicho" do que inventar uma dor falsa.

## SAÍDA — responda SOMENTE um JSON:
{
 "ruminacoes": ["...", "..."],
 "dor_central": "a que mais dói e move dinheiro (1ª pessoa) — ou '' se o nicho for genérico demais",
 "porque": "1 frase seca explicando a escolha E lembrando que isso é hipótese, não prova — confirma com cliente real",
 "status": "hipotese",
 "como_validar": { "onde": ["reviews 1-2★", "grupos do nicho", "autocomplete do Google", "3 conversas com donos"], "perguntas": ["2-3 perguntas pra fazer a um cliente real que confirmam ou derrubam essa dor"] },
 "aviso": "'' normalmente; ou o texto sobre nicho genérico demais quando for o caso"
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { nicho, cliente } = body || {};
  if (!nicho) return res.status(400).json({ error: 'Informe o nicho.' });

  const user_msg = `Nicho: ${nicho}\nO que o aluno sabe do cliente: ${cliente || '(pouca coisa — deduza pelo nicho, mas se o nicho for genérico demais, avisa em vez de inventar)'}\nDevolva o JSON.`;
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
