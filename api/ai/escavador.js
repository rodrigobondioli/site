// 🛠️ O Escavador — conduz a Aula 1 (VOCÊ). Entrevista conversacional, 1 pergunta por vez, extrai o schema `voce`.
// Servidor STATELESS: o cliente guarda o estado (history + voce) e manda a cada turno. A memória real é o objeto `voce`.
// Gate 1 OFICIAL é calculado no cliente por gateForBlock(0, voce) — aqui só devolvemos um diagnóstico de suficiência (advisory).
// Ponte de compatibilidade: além do `voce` rico, sintetizamos os campos legados (mundos/forte/turmas/historia) que Canvas/Estrategista já leem.
import { getUser, ai, extractJSON, MODEL_FAST } from '../_auth.js';

export const SYSTEM = `Você é "O Escavador", a IA que conduz a Aula 1 (VOCÊ) do curso De Genérico a Especialista (Rodrigo Bondioli).
Voz: direta, seca, anti-guru, tiozão sem frescura. Sem emoji, sem "querido(a)", sem motivação, sem floreio.

## O QUE VOCÊ FAZ
Você ENTREVISTA o aluno pra minerar a matéria-prima do posicionamento dele. UMA pergunta por vez. Conversa, não formulário.
A cada resposta: EXTRAI o que der pros campos do schema (silenciosamente) e faz a PRÓXIMA pergunta — só do que ainda falta ou veio raso.
Se a resposta já vier rica, preenche VÁRIOS campos de uma vez e pula o que já está coberto. NUNCA reoferece o questionário inteiro.

## O QUE VOCÊ CAVA (nesta ordem, pulando o que já veio):
1. COMUNIDADES/MUNDOS que ele vive por dentro (trampo antigo, negócio de família, hobby, cena) — e o PROBLEMA que ele viu ali. Útil: 1 forte OU 3 razoáveis.
2. COMPETÊNCIAS — o que ele faz bem, cada uma com UM EXEMPLO concreto. Mín. 3.
3. PROVAS — caso real em Situação → Ação → Consequência. Mín. 1 (2 ideal). Vago? PEDE a consequência/resultado.
4. HISTÓRIA — 1 virada que conecta com o trabalho de hoje (não história solta).
5. PREFERÊNCIAS — o que ama e o que odeia fazer (uns 3 de cada).
6. MEDOS (pergunta FINAL) — o que segura ele no genérico, o medo de nichar. Cru.

## COMO CAVAR
- Barra o abstrato: "design" não é competência, "ajudo empresas" não é comunidade. Pede o concreto.
- Sem exemplo, a competência não conta. Sem consequência, a prova não conta. Insiste UMA vez, seco, e segue.
- NÃO inventa pelo aluno. Se ele não tem, registra que não tem — isso é dado, não fracasso.

## FECHAMENTO
Quando tiver matéria-prima utilizável (≥1 prova concreta OU ≥1 competência com exemplo forte, + comunidade + história), FECHA: done=true, reply = resumo seco de 2-3 linhas do que captou + a deixa ("Isso já dá base. Bora pro Território."). Nunca fecha fingindo que o raso é rico.

## SAÍDA — responda SOMENTE um JSON, nada fora dele:
{
 "reply": "sua próxima fala — UMA pergunta, ou o fechamento. Seca e direta.",
 "voce": {
   "comunidades": [{"nome":"","como_conhece":"","problema":"","evidencia":""}],
   "competencias": [{"o_que":"","exemplo":""}],
   "provas": [{"situacao":"","acao":"","consequencia":""}],
   "historia": "",
   "preferencias": {"ama":[],"odeia":[]},
   "medos": ""
 },
 "campo_atual": "comunidades|competencias|provas|historia|preferencias|medos|fechamento",
 "done": false,
 "suficiencia": {"diagnostico":"1 frase seca do que já tem e do que falta","faltando":["ex: prova concreta"]}
}
Devolva SEMPRE o objeto "voce" COMPLETO e atualizado (tudo captado até agora, não só o novo). Campo sem info = vazio/array vazio.`;

// ---------- helpers puros (testáveis sem API) ----------
function arr(x) { return Array.isArray(x) ? x : []; }
function str(x) { return x == null ? '' : String(x); }

// garante o formato do voce (só estrutura, sem legado)
export function normalizeVoce(v) {
  v = v || {};
  var pref = v.preferencias || {};
  return {
    comunidades: arr(v.comunidades),
    competencias: arr(v.competencias),
    provas: arr(v.provas),
    historia: str(v.historia),
    preferencias: { ama: arr(pref.ama), odeia: arr(pref.odeia) },
    medos: str(v.medos)
  };
}

// sintetiza os campos legados que Canvas/Estrategista/gateForBlock(0) já consomem — determinístico, não depende da IA
export function withLegacy(v) {
  var comu = v.comunidades.map(function (c) { return str(c && c.nome).trim(); }).filter(Boolean).join('; ');
  var forte = '';
  if (v.provas[0]) forte = 'prova: ' + [v.provas[0].situacao, v.provas[0].acao, v.provas[0].consequencia].map(str).filter(function (s) { return s.trim(); }).join(' → ');
  else if (v.competencias[0]) forte = 'competência: ' + [v.competencias[0].o_que, v.competencias[0].exemplo].map(str).filter(function (s) { return s.trim(); }).join(' — ');
  return Object.assign({}, v, { mundos: comu, forte: forte, turmas: comu, historia: v.historia });
}

// merge protetor: se o modelo esvaziar algo que já tínhamos, mantém o anterior
export function mergeVoce(prev, modelV) {
  prev = normalizeVoce(prev);
  if (!modelV) return withLegacy(prev);
  var m = normalizeVoce(modelV);
  ['comunidades', 'competencias', 'provas'].forEach(function (k) { if ((!m[k] || !m[k].length) && prev[k] && prev[k].length) m[k] = prev[k]; });
  if (!m.historia && prev.historia) m.historia = prev.historia;
  if (!m.medos && prev.medos) m.medos = prev.medos;
  if (!m.preferencias.ama.length && !m.preferencias.odeia.length && prev.preferencias && (prev.preferencias.ama.length || prev.preferencias.odeia.length)) m.preferencias = prev.preferencias;
  return withLegacy(m);
}

// lógica de UM turno (pura menos a chamada de IA — o harness usa isto direto)
export async function escavadorTurn(body) {
  var voce = normalizeVoce(body && body.voce);
  var history = arr(body && body.history).slice(-8);
  // UMA system só (Gemini engasga com múltiplas system) — o estado do voce entra no fim do system.
  var sys = SYSTEM + '\n\n## ESTADO ATUAL DO voce (JSON já captado — atualize e devolva COMPLETO):\n' + JSON.stringify(voce);
  var msgs = [{ role: 'system', content: sys }];
  if (!history.length) msgs.push({ role: 'user', content: 'Começa a entrevista — abre com UMA pergunta curta.' });
  else history.forEach(function (m) { if (m && m.role && m.content) msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: str(m.content) }); });

  var out = await ai(MODEL_FAST(), msgs, 2048, 0.5);
  var data = extractJSON(out) || {};
  return {
    reply: data.reply || 'Me conta um exemplo concreto: um mercado ou lugar que você já viveu por dentro — e um problema que você viu lá.',
    voce: mergeVoce(voce, data.voce),
    campo_atual: data.campo_atual || 'comunidades',
    done: !!data.done,
    suficiencia: (data.suficiencia && typeof data.suficiencia === 'object') ? data.suficiencia : { diagnostico: '', faltando: [] }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  try {
    const data = await escavadorTurn(body || {});
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
