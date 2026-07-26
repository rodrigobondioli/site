// 🛠️ O Escavador — conduz a Aula 1 (VOCÊ). Entrevista conversacional, 1 pergunta por vez, extrai o schema `voce`.
//
// ARQUITETURA (fonte de verdade ÚNICA): o SERVIDOR é o cérebro.
//   - decide()      → decide, de forma DETERMINÍSTICA, qual é a próxima área/gap, se pode pular, se pode encerrar. (código, não IA)
//   - questionFor() → a pergunta é um TEMPLATE contextual (usa as palavras do próprio aluno). Nunca genérica, nunca da área errada.
//   - a IA faz UMA coisa só: EXTRAIR o que o aluno acabou de dizer pros campos do schema (+ um "ack" curto opcional). Ela NÃO decide o fluxo.
//   - o CLIENTE é BURRO: só renderiza o que o servidor devolve (área, pergunta, pode_pular, fechado). Não recomputa gap, não injeta pergunta fixa.
// Isso mata: repetir pergunta já respondida, ignorar resposta, área errada no cabeçalho, encerrar cedo, prompt×cliente disputando o fluxo.
//
// Servidor STATELESS: o cliente guarda o estado (history + voce, incluindo _skip) e manda a cada turno.
// Ponte de compatibilidade: withLegacy() sintetiza os campos legados (mundos/forte/turmas/historia) que Canvas/Estrategista já leem.
import { getUser, aiRateOk, ai, extractJSON, MODEL_FAST } from '../_auth.js';

// A IA só EXTRAI. Não decide pergunta, não conduz fluxo.
export const SYSTEM = `Você é "O Escavador", o extrator da Aula 1 (VOCÊ) do curso De Genérico a Especialista (Rodrigo Bondioli).
Voz nos textos: direta, seca, anti-guru, tiozão sem frescura. Sem emoji, sem motivação, sem floreio.

## SUA ÚNICA FUNÇÃO
LER a última resposta do aluno e EXTRAIR o que der pros campos do schema. Você NÃO escolhe a próxima pergunta — quem faz isso é o sistema. NÃO faça perguntas. NÃO conduza a conversa. Só extraia + dê uma reação curtíssima ("ack") se couber.

## O QUE CADA CAMPO GUARDA
- comunidades: mercado/comunidade/tipo de cliente que o aluno conhece (viveu, atendeu, convive). "nome" = o mundo; "problema" = o que ele via de mal resolvido ali; "como_conhece" = por que conhece.
- competencias: o que o aluno faz bem. "o_que" = a competência (concreta, nas palavras dele); "exemplo" = o caso concreto que ele contou.
- provas: resultado concreto de um trabalho. "consequencia" = o que melhorou pro cliente (aceita qualitativo: menos alteração, aprovação mais rápida, cliente mais seguro).
- medos: o medo REAL do próprio aluno ligado a nichar/se posicionar (ex: "medo de perder trabalhos se me fechar"). NÃO é a dor do cliente. Se ele disser que não tem, registre "não tem".
- historia: como ele entrou nesse mundo / virada que conecta com o trabalho de hoje.
- preferencias: {ama:[], odeia:[]} — o que gosta e o que dá preguiça.

## CAPTURE A RESPOSTA INTEIRA (regra dura)
Se numa resposta só o aluno já traz competência + exemplo + resultado, PREENCHA TUDO de uma vez — nunca deixe "exemplo" nem a prova vazios quando ele já contou o caso.
Ex: "fiz o redesign de um site, identifiquei vários problemas e ele converteu 10% mais" →
  "competencias":[{"o_que":"redesign de site / identificar problemas","exemplo":"redesign de um site identificando vários problemas","raw":"fiz o redesign de um site, identifiquei vários problemas"}]
  "provas":[{"consequencia":"converteu 10% mais","raw":"converteu 10% mais"}]

## NORMALIZAR, NÃO REINTERPRETAR (regra dura)
O que você salva tem que ser FIEL ao que o aluno disse. Preserve as palavras e o sentido dele. Pode limpar repetição — NÃO pode criar método, nome, resultado ou "consultorês" que ele não falou.
Aluno: "Meus layouts costumam ser aprovados rápido." → OK: "Aprovação rápida dos layouts." → PROIBIDO: "Entregas de design mais objetivas e estratégicas."
NUNCA vire "fiz o redesign de um site que converteu mais" em rótulo tipo "interfaces web de alta conversão". São as palavras DELE, não uma etiqueta tua.
Em cada item de lista, "raw" guarda as palavras LITERAIS do aluno.

## SAÍDA — responda SOMENTE um JSON, nada fora dele:
{
 "ack": "reação curtíssima ao que ele disse — no MÁXIMO 1 frase, SEM pergunta, SEM '?'. Pode ser \\"\\" se não couber nada honesto.",
 "delta": {
   "comunidades": [{"nome":"","como_conhece":"","problema":"","raw":""}],
   "competencias": [{"o_que":"","exemplo":"","raw":""}],
   "provas": [{"situacao":"","acao":"","consequencia":"","raw":""}],
   "historia": "",
   "preferencias": {"ama":[],"odeia":[]},
   "medos": ""
 }
}
REGRAS DO DELTA: inclua APENAS o(s) campo(s) que MUDARAM nesta resposta — os que não tocou, NÃO coloque (o servidor preserva o que já existe). Em listas, mande só o item NOVO ou o item ENRIQUECIDO (o servidor mescla por identidade e nunca perde os antigos). Se a resposta não trouxe nada de aproveitável, "delta": {}.`;

// ---------- helpers puros ----------
function arr(x) { return Array.isArray(x) ? x : []; }
function str(x) { return x == null ? '' : String(x); }
function norm(s) { return str(s).toLowerCase().replace(/\s+/g, ' ').trim(); }

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

// sintetiza os campos legados que Canvas/Estrategista/gateForBlock(0) já consomem — determinístico
export function withLegacy(v) {
  var comu = v.comunidades.map(function (c) { return str(c && c.nome).trim(); }).filter(Boolean).join('; ');
  var forte = '';
  if (v.provas[0]) forte = 'prova: ' + [v.provas[0].situacao, v.provas[0].acao, v.provas[0].consequencia].map(str).filter(function (s) { return s.trim(); }).join(' → ');
  else if (v.competencias[0]) forte = 'competência: ' + [v.competencias[0].o_que, v.competencias[0].exemplo].map(str).filter(function (s) { return s.trim(); }).join(' — ');
  return Object.assign({}, v, { mundos: comu, forte: forte, turmas: comu, historia: v.historia });
}

// ---------- merge por DELTA (nunca perde o que já tinha; mescla por identidade) ----------
function mergeArr(prevArr, deltaArr, key) {
  var out = arr(prevArr).slice();
  arr(deltaArr).forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    if (!Object.keys(item).some(function (k) { return str(item[k]).trim(); })) return; // ignora item vazio
    var id = String(item[key] || '').trim().toLowerCase();
    var idx = id ? out.findIndex(function (p) { return String(p[key] || '').trim().toLowerCase() === id; }) : -1;
    if (idx >= 0) out[idx] = Object.assign({}, out[idx], item); // enriquece o existente
    else out.push(item);                                        // item novo
  });
  return out;
}
export function mergeDelta(prev, delta) {
  prev = normalizeVoce(prev);
  if (!delta || typeof delta !== 'object') return withLegacy(prev);
  var out = { comunidades: prev.comunidades, competencias: prev.competencias, provas: prev.provas, historia: prev.historia, preferencias: prev.preferencias, medos: prev.medos };
  if (delta.comunidades != null) out.comunidades = mergeArr(prev.comunidades, delta.comunidades, 'nome');
  if (delta.competencias != null) out.competencias = mergeArr(prev.competencias, delta.competencias, 'o_que');
  if (delta.provas != null) out.provas = mergeArr(prev.provas, delta.provas, 'consequencia');
  if (typeof delta.historia === 'string' && delta.historia.trim()) out.historia = delta.historia;
  if (typeof delta.medos === 'string' && delta.medos.trim()) out.medos = delta.medos;
  if (delta.preferencias && typeof delta.preferencias === 'object') {
    out.preferencias = { ama: arr(delta.preferencias.ama).length ? arr(delta.preferencias.ama) : prev.preferencias.ama, odeia: arr(delta.preferencias.odeia).length ? arr(delta.preferencias.odeia) : prev.preferencias.odeia };
  }
  return withLegacy(normalizeVoce(out));
}

// ---------- CÉREBRO: decisão determinística da próxima área/gap ----------
function has(a, f) { return arr(a).some(function (x) { return x && String((f ? x[f] : x) || '').trim(); }); }

export function suficiente(v) {
  v = normalizeVoce(v);
  var essComunidade = has(v.comunidades, 'nome');
  var essCompetencia = has(v.competencias, 'o_que');
  var essProva = has(v.provas, 'consequencia') || arr(v.competencias).some(function (c) { return c && String(c.exemplo || '').trim(); });
  var essMedos = !!String(v.medos || '').trim();
  return !!(essComunidade && essCompetencia && essProva && essMedos); // História/Preferências são complementares (não travam)
}

function mk(area, gap, v, skip) {
  return {
    area: area, gap: gap,
    pode_pular: (area === 'historia' || area === 'preferencias'),
    pode_encerrar: suficiente(v),
    fechado: gap === 'fechamento'
  };
}
// ORDEM: comunidades → competências(identificar→exemplo, com prova junto) → medos → [história] → [preferências] → fechamento
export function decide(v, skip) {
  v = normalizeVoce(v); skip = skip || {};
  var comu = arr(v.comunidades).filter(function (c) { return c && str(c.nome).trim(); });
  var comp = arr(v.competencias);

  if (comu.length === 0) return mk('comunidades', 'comunidade_1', v, skip);
  if (comu.length < 2 && !str(comu[0].problema).trim()) return mk('comunidades', 'comunidade_problema', v, skip);
  if (comu.length < 2) return mk('comunidades', 'comunidade_2', v, skip);

  if (!has(v.competencias, 'o_que')) return mk('competencias', 'comp_identificar', v, skip);
  // exemplo satisfeito por QUALQUER caminho: exemplo na competência OU uma prova/consequência já captada (o resultado É o exemplo).
  var temExemplo = comp.some(function (c) { return c && str(c.exemplo).trim(); }) || has(v.provas, 'consequencia') || has(v.provas, 'situacao');
  if (!temExemplo) return mk('competencias', 'comp_exemplo', v, skip);

  if (!str(v.medos).trim()) return mk('medos', 'medos', v, skip);

  if (!str(v.historia).trim() && !skip.historia) return mk('historia', 'historia', v, skip);
  if (!(v.preferencias.ama.length || v.preferencias.odeia.length) && !skip.preferencias) return mk('preferencias', 'preferencias', v, skip);
  return mk('fechamento', 'fechamento', v, skip);
}
// mantido por compatibilidade (nada externo usa, mas exportado)
export function gapHint(v) { return decide(v, (v && v._skip) ? (v._skip.reduce(function (o, k) { o[k] = 1; return o; }, {})) : {}).gap; }

// ---------- PERGUNTAS: templates contextuais (usam as palavras do aluno) ----------
function firstComuName(v) { var c = arr(v.comunidades).find(function (x) { return x && str(x.nome).trim(); }); return c ? str(c.nome).trim() : ''; }
function compSemExemplo(v) { var c = arr(v.competencias).find(function (x) { return x && str(x.o_que).trim() && !str(x.exemplo).trim(); }); return c ? str(c.o_que).trim() : ''; }

function questionFor(gap, v) {
  switch (gap) {
    case 'comunidade_1':
      return 'Me diz um mercado, comunidade ou tipo de cliente que você conhece por experiência — porque viveu nesse meio, já atendeu ou convive de perto.';
    case 'comunidade_problema': {
      var n = firstComuName(v);
      return 'Que problema você mais via ' + (n ? ('em ' + n) : 'ali') + ' que ninguém resolvia direito?';
    }
    case 'comunidade_2':
      return 'Me diz outro mercado, comunidade ou tipo de cliente que você conhece ou gostaria de atender — e, se tiver, um problema que você via ali.';
    case 'comp_identificar':
      return 'Agora sobre você: qual parte do teu trabalho costuma sair bem na tua mão? Pode ser organizar um site confuso, entender rápido o cliente, apresentar uma direção que ele aprova…';
    case 'comp_exemplo': {
      var o = compSemExemplo(v);
      return 'Me dá um exemplo rápido de um projeto onde ' + (o ? o : 'isso') + ' fez diferença — e o que melhorou pro cliente por causa disso.';
    }
    case 'medos':
      return 'Falta entender o que pode te travar nessa escolha. O que mais te dá medo quando você pensa em escolher um nicho e se posicionar de forma mais específica?';
    case 'historia':
      return 'Como você entrou nesse mundo? Conta rapidinho de onde vem tua história com design.';
    case 'preferencias':
      return 'O que você mais gosta de fazer no trabalho — e o que te dá preguiça? Manda os dois.';
    default:
      return '';
  }
}
function closingLine() {
  return 'É isso — já dá uma base boa de matéria-prima pra montar teu posicionamento. Dá pra voltar e completar quando quiser.';
}
function sanitizeAck(ack) {
  ack = str(ack).replace(/\s+/g, ' ').trim();
  if (!ack) return '';
  if (ack.indexOf('?') >= 0) ack = ack.split('?')[0].trim();       // ack nunca faz pergunta
  if (ack.length > 140) ack = ack.slice(0, 140).trim();
  if (ack.length < 3) return '';
  if (!/[.!…]$/.test(ack)) ack += '.';
  return ack;
}

// ---------- parse à prova de bala ----------
function tryObj(s) {
  try { return JSON.parse(s); } catch (e) {}
  try { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')); } catch (e) {}
  return null;
}
function parseLoose(out) {
  var s = String(out || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  var d = extractJSON(s) || tryObj(s);
  if (d) return d;
  var a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { d = tryObj(s.slice(a, b + 1)); if (d) return d; }
  return null;
}

async function askAI(m, tokens, temp) { try { return await ai(MODEL_FAST(), m, tokens, temp); } catch (e) { return ''; } }

// UMA chamada de IA: só extrai o delta (+ ack). Output pequeno = pouco risco de truncar.
async function extractAI(voce, history, askArea) {
  if (!history.length) return { delta: {}, ack: '' };
  var sys = SYSTEM
    + '\n\n## ESTADO ATUAL (já captado — devolve só o DELTA do que MUDOU):\n' + JSON.stringify(voce)
    + '\n## A ÚLTIMA PERGUNTA MIRAVA A ÁREA: "' + askArea + '". Encaixe a resposta principalmente aí, mas capte qualquer outra coisa que aparecer.';
  var msgs = [{ role: 'system', content: sys }];
  history.forEach(function (m) { if (m && m.role && m.content) msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: str(m.content) }); });
  var data = parseLoose(await askAI(msgs, 2048, 0.3));
  if (!data || (data.delta == null && data.ack == null)) {
    var msgs2 = msgs.concat([{ role: 'user', content: 'Devolva AGORA só o JSON com "ack" e "delta". Nada fora do JSON.' }]);
    data = parseLoose(await askAI(msgs2, 2048, 0.2)) || {};
  }
  return { delta: (data && data.delta) || {}, ack: str(data && data.ack) };
}

function lastAssistant(history) {
  for (var i = arr(history).length - 1; i >= 0; i--) { if (history[i] && history[i].role === 'assistant') return str(history[i].content); }
  return '';
}
function lastUser(history) {
  for (var i = arr(history).length - 1; i >= 0; i--) { if (history[i] && history[i].role === 'user') return str(history[i].content); }
  return '';
}

// monta a devolução (decisão + pergunta) a partir do estado já mesclado
function build(voce, skip, ack, repeatGuardLast) {
  var D = decide(voce, skip);
  var reply;
  if (D.fechado) {
    reply = closingLine();
  } else {
    var q = questionFor(D.gap, voce);
    var a = sanitizeAck(ack);
    // se NÃO captou nada e íamos repetir a MESMA pergunta, avisa que não pegou (evita loop idêntico)
    if (repeatGuardLast && norm(q) === norm(repeatGuardLast)) reply = 'Não peguei bem — me responde em uma frase: ' + q;
    else reply = (a ? a + ' ' : '') + q;
  }
  var out = withLegacy(voce);
  out._skip = Object.keys(skip);
  // ESTADO (contrato): 'coletando' enquanto falta obrigatório · 'base_pronta' quando os 4 obrigatórios entraram.
  // 'concluido' NÃO existe aqui — quem conclui é o ALUNO no clique (o servidor NUNCA manda done=true).
  return {
    reply: reply,
    voce: out,
    area_atual: D.area,
    proximo_gap: D.gap,
    pode_pular: D.pode_pular,        // só nos complementares (história/preferências)
    pode_encerrar: D.pode_encerrar,  // 4 obrigatórios ok → aluno JÁ pode seguir, mesmo com complementar vazio
    base_pronta: D.pode_encerrar,
    estado: D.pode_encerrar ? 'base_pronta' : 'coletando',
    fechado: D.fechado,              // nada mais a perguntar (obrigatórios ok + complementares preenchidos ou pulados)
    done: false,
    suficiente: D.pode_encerrar
  };
}

// lógica de UM turno (o servidor decide tudo; a IA só extrai)
export async function escavadorTurn(body) {
  var raw = (body && body.voce) || {};
  var skip = {}; arr(raw._skip).forEach(function (k) { skip[k] = 1; });
  var voceBefore = normalizeVoce(raw);
  var history = arr(body && body.history).slice(-8);
  var skipField = body && body.skip;

  // AÇÃO DE PULAR (complementar) — sem IA, só recomputa e devolve a próxima
  if (skipField === 'historia' || skipField === 'preferencias') {
    skip[skipField] = 1;
    return build(voceBefore, skip, '', null);
  }

  // TURNO NORMAL — extrai o que o aluno disse e recomputa o fluxo
  var askArea = decide(voceBefore, skip).area;
  var ex = await extractAI(voceBefore, history, askArea);
  var merged = mergeDelta(voceBefore, ex.delta);

  // ANTI-REASK do exemplo: se JÁ pedimos o exemplo e o aluno respondeu, mas a extração não preencheu,
  // conta a resposta crua como exemplo e SEGUE — nunca pede o mesmo exemplo duas vezes.
  var forced = false;
  var mn = normalizeVoce(merged);
  if (decide(mn, skip).gap === 'comp_exemplo') {
    var la = lastAssistant(history), lu = lastUser(history);
    if (lu && /exemplo|fez diferen|melhorou/i.test(la)) {
      var alvo = mn.competencias.find(function (c) { return c && str(c.o_que).trim() && !str(c.exemplo).trim(); });
      if (alvo) { alvo.exemplo = lu; merged = withLegacy(mn); forced = true; }
    }
  }

  var mudou = forced || JSON.stringify(normalizeVoce(merged)) !== JSON.stringify(normalizeVoce(voceBefore));
  return build(merged, skip, ex.ack, mudou ? null : lastAssistant(history));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  if (!(await aiRateOk(user.id))) return res.status(429).json({ error: 'Você bateu o limite de uso da IA por hoje. Tenta amanhã ou fala com o suporte.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  try {
    const data = await escavadorTurn(body || {});
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
